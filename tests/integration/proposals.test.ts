import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { createTestPrisma, createUser, createProposal, closeTestPrisma } from './helpers'

// ── Create test client at module scope (once for the whole suite) ──
const testClient = createTestPrisma()
const db = testClient.db
const pool = testClient.pool

// ── Module mocks (hoisted before other imports) ──
vi.mock('@/lib/auth-helpers', () => ({
  getAuthenticatedUserId: vi.fn(),
}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))
vi.mock('@/lib/prisma', () => ({
  get prisma() { return db },
}))

// ── Import Server Actions after mocks are registered ──
import { getAuthenticatedUserId } from '@/lib/auth-helpers'
import {
  createProposal as createProposalAction,
  respondToProposal,
  acceptCounter,
  cancelSwap,
} from '@/actions/proposals'

const mockAuth = vi.mocked(getAuthenticatedUserId)

beforeEach(async () => {
  vi.resetAllMocks()
  await db.proposal.deleteMany()
  await db.user.deleteMany()
})

afterAll(async () => {
  await closeTestPrisma(db, pool)
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function fd(entries: Record<string, string>) {
  const form = new FormData()
  for (const [k, v] of Object.entries(entries)) form.append(k, v)
  return form
}

// ── createProposal ────────────────────────────────────────────────────────────

describe('createProposal', () => {
  it('creates a PENDING proposal when both skills are valid', async () => {
    const alice = await createUser(db, { email: 'alice@test.com', canTeach: ['TypeScript'], wantToLearn: ['Go'] })
    const bob   = await createUser(db, { email: 'bob@test.com',   canTeach: ['Go'],         wantToLearn: ['TypeScript'] })

    mockAuth.mockResolvedValueOnce(alice.id)

    const result = await createProposalAction(null, fd({
      counterpartId: bob.id,
      offeredSkill: 'TypeScript',
      requestedSkill: 'Go',
    }))

    expect(result).toBeNull()

    const proposals = await db.proposal.findMany()
    expect(proposals).toHaveLength(1)
    expect(proposals[0].status).toBe('PENDING')
    expect(proposals[0].proposerId).toBe(alice.id)
  })

  it('rejects when offeredSkill is not in caller canTeach', async () => {
    const alice = await createUser(db, { email: 'alice@test.com', canTeach: ['TypeScript'], wantToLearn: ['Go'] })
    const bob   = await createUser(db, { email: 'bob@test.com',   canTeach: ['Rust'],       wantToLearn: ['TypeScript'] })

    mockAuth.mockResolvedValueOnce(alice.id)

    const result = await createProposalAction(null, fd({
      counterpartId: bob.id,
      offeredSkill: 'Rust',       // alice cannot teach Rust
      requestedSkill: 'Rust',
    }))

    expect(result).toEqual({ success: false, error: "You can only offer skills from your 'can teach' list" })

    const proposals = await db.proposal.findMany()
    expect(proposals).toHaveLength(0)
  })
})

// ── respondToProposal — accept ────────────────────────────────────────────────

describe('respondToProposal / accept', () => {
  it('transitions proposal to AGREED when counterpart accepts', async () => {
    const alice = await createUser(db, { email: 'alice@test.com', canTeach: ['TypeScript'] })
    const bob   = await createUser(db, { email: 'bob@test.com',   canTeach: ['Go'] })
    const proposal = await createProposal(db, alice.id, bob.id)

    mockAuth.mockResolvedValueOnce(bob.id)

    const result = await respondToProposal(null, fd({
      proposalId: proposal.id,
      action: 'accept',
    }))

    expect(result).toBeNull()

    const updated = await db.proposal.findUniqueOrThrow({ where: { id: proposal.id } })
    expect(updated.status).toBe('AGREED')
  })

  it('rejects when proposer tries to accept their own proposal', async () => {
    const alice = await createUser(db, { email: 'alice@test.com', canTeach: ['TypeScript'] })
    const bob   = await createUser(db, { email: 'bob@test.com',   canTeach: ['Go'] })
    const proposal = await createProposal(db, alice.id, bob.id)

    mockAuth.mockResolvedValueOnce(alice.id)

    const result = await respondToProposal(null, fd({
      proposalId: proposal.id,
      action: 'accept',
    }))

    expect(result).toEqual({ success: false, error: 'This proposal is no longer open' })
  })
})

// ── Full happy path: proposal → counter → acceptCounter ──────────────────────

describe('full happy path', () => {
  it('proposal → counter → acceptCounter produces AGREED with promoted counter fields', async () => {
    const alice = await createUser(db, {
      email: 'alice@test.com',
      canTeach: ['TypeScript'],
      wantToLearn: ['Go'],
    })
    const bob = await createUser(db, {
      email: 'bob@test.com',
      canTeach: ['Go', 'Rust'],
      wantToLearn: ['TypeScript'],
    })

    // Step 1: alice proposes
    mockAuth.mockResolvedValueOnce(alice.id)
    await createProposalAction(null, fd({
      counterpartId: bob.id,
      offeredSkill: 'TypeScript',
      requestedSkill: 'Go',
    }))

    const proposal = await db.proposal.findFirstOrThrow({ where: { proposerId: alice.id } })
    expect(proposal.status).toBe('PENDING')

    // Step 2: bob counters (offers Rust instead of Go)
    mockAuth.mockResolvedValueOnce(bob.id)
    await respondToProposal(null, fd({
      proposalId: proposal.id,
      action: 'counter',
      counterOfferedSkill: 'Rust',
      counterRequestedSkill: 'TypeScript',
    }))

    const countered = await db.proposal.findUniqueOrThrow({ where: { id: proposal.id } })
    expect(countered.status).toBe('COUNTERED')
    expect(countered.counterOfferedSkill).toBe('Rust')
    expect(countered.counterRequestedSkill).toBe('TypeScript')

    // Step 3: alice accepts counter
    mockAuth.mockResolvedValueOnce(alice.id)
    const acceptResult = await acceptCounter(null, fd({ proposalId: proposal.id }))
    expect(acceptResult).toBeNull()

    const agreed = await db.proposal.findUniqueOrThrow({ where: { id: proposal.id } })
    expect(agreed.status).toBe('AGREED')
    expect(agreed.offeredSkill).toBe('Rust')
    expect(agreed.requestedSkill).toBe('TypeScript')
    expect(agreed.counterOfferedSkill).toBeNull()
    expect(agreed.counterRequestedSkill).toBeNull()
  })
})

// ── Stale action rejection ────────────────────────────────────────────────────

describe('stale action rejection', () => {
  it('returns error when accepting an already-cancelled proposal', async () => {
    const alice = await createUser(db, { email: 'alice@test.com', canTeach: ['TypeScript'] })
    const bob   = await createUser(db, { email: 'bob@test.com',   canTeach: ['Go'] })

    const proposal = await createProposal(db, alice.id, bob.id)
    await db.proposal.update({ where: { id: proposal.id }, data: { status: 'CANCELLED' } })

    mockAuth.mockResolvedValueOnce(bob.id)

    const result = await respondToProposal(null, fd({
      proposalId: proposal.id,
      action: 'accept',
    }))

    expect(result).toEqual({ success: false, error: 'This proposal is no longer open' })
  })
})

// ── cancelSwap ────────────────────────────────────────────────────────────────

describe('cancelSwap', () => {
  it('cancels an AGREED swap when called by either party', async () => {
    const alice = await createUser(db, { email: 'alice@test.com', canTeach: ['TypeScript'] })
    const bob   = await createUser(db, { email: 'bob@test.com',   canTeach: ['Go'] })
    const proposal = await createProposal(db, alice.id, bob.id)
    await db.proposal.update({ where: { id: proposal.id }, data: { status: 'AGREED' } })

    mockAuth.mockResolvedValueOnce(alice.id)

    const result = await cancelSwap(null, fd({ proposalId: proposal.id }))

    expect(result).toBeNull()

    const updated = await db.proposal.findUniqueOrThrow({ where: { id: proposal.id } })
    expect(updated.status).toBe('CANCELLED')
  })
})

// ── Email visibility ──────────────────────────────────────────────────────────

describe('email visibility', () => {
  it('excludes email when querying proposal parties without email in select', async () => {
    const alice = await createUser(db, { email: 'alice@test.com', canTeach: ['TypeScript'] })
    const bob   = await createUser(db, { email: 'bob@test.com',   canTeach: ['Go'] })

    await createProposal(db, alice.id, bob.id)

    const aliceProposals = await db.proposal.findMany({
      where: { proposerId: alice.id },
      include: {
        proposer:    { select: { id: true, name: true } },
        counterpart: { select: { id: true, name: true } },
      },
    })
    expect(aliceProposals).toHaveLength(1)
    expect((aliceProposals[0].proposer as Record<string, unknown>).email).toBeUndefined()
    expect((aliceProposals[0].counterpart as Record<string, unknown>).email).toBeUndefined()
  })
})
