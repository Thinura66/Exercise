import { describe, it, expect } from 'vitest'
import {
  isSkillInList,
  canAccept,
  canCounter,
  canDecline,
  canCancel,
} from '@/lib/guards'

const PENDING   = 'PENDING'
const AGREED    = 'AGREED'
const DECLINED  = 'DECLINED'
const COUNTERED = 'COUNTERED'
const CANCELLED = 'CANCELLED'

const proposer    = 'user-proposer'
const counterpart = 'user-counterpart'
const stranger    = 'user-stranger'

function makeProposal(status: string) {
  return { status, proposerId: proposer, counterpartId: counterpart }
}

// ── isSkillInList ───────────────────────────────────────────────────

describe('isSkillInList', () => {
  it('returns true when skill is in list', () => {
    expect(isSkillInList('TypeScript', ['TypeScript', 'Go'])).toBe(true)
  })

  it('returns false when skill is not in list', () => {
    expect(isSkillInList('Rust', ['TypeScript', 'Go'])).toBe(false)
  })

  it('returns false for empty list', () => {
    expect(isSkillInList('TypeScript', [])).toBe(false)
  })

  it('is case-sensitive', () => {
    expect(isSkillInList('typescript', ['TypeScript'])).toBe(false)
  })
})

// ── canAccept ───────────────────────────────────────────────────────

describe('canAccept', () => {
  it('returns true when counterpart accepts a PENDING proposal', () => {
    expect(canAccept(makeProposal(PENDING), counterpart)).toBe(true)
  })

  it('returns false when proposer tries to accept', () => {
    expect(canAccept(makeProposal(PENDING), proposer)).toBe(false)
  })

  it('returns false when stranger tries to accept', () => {
    expect(canAccept(makeProposal(PENDING), stranger)).toBe(false)
  })

  it('returns false when proposal is already AGREED', () => {
    expect(canAccept(makeProposal(AGREED), counterpart)).toBe(false)
  })

  it('returns false when proposal is COUNTERED', () => {
    expect(canAccept(makeProposal(COUNTERED), counterpart)).toBe(false)
  })

  it('returns false when proposal is DECLINED', () => {
    expect(canAccept(makeProposal(DECLINED), counterpart)).toBe(false)
  })
})

// ── canCounter ──────────────────────────────────────────────────────

describe('canCounter', () => {
  it('returns true when counterpart counters a PENDING proposal', () => {
    expect(canCounter(makeProposal(PENDING), counterpart)).toBe(true)
  })

  it('returns false when proposer tries to counter', () => {
    expect(canCounter(makeProposal(PENDING), proposer)).toBe(false)
  })

  it('returns false when proposal is AGREED', () => {
    expect(canCounter(makeProposal(AGREED), counterpart)).toBe(false)
  })

  it('returns false when proposal is COUNTERED', () => {
    expect(canCounter(makeProposal(COUNTERED), counterpart)).toBe(false)
  })
})

// ── canDecline ──────────────────────────────────────────────────────

describe('canDecline', () => {
  it('returns true when counterpart declines a PENDING proposal', () => {
    expect(canDecline(makeProposal(PENDING), counterpart)).toBe(true)
  })

  it('returns true when proposer declines a COUNTERED proposal', () => {
    expect(canDecline(makeProposal(COUNTERED), proposer)).toBe(true)
  })

  it('returns false when proposer tries to decline a PENDING proposal', () => {
    expect(canDecline(makeProposal(PENDING), proposer)).toBe(false)
  })

  it('returns false when counterpart tries to decline a COUNTERED proposal', () => {
    expect(canDecline(makeProposal(COUNTERED), counterpart)).toBe(false)
  })

  it('returns false for a stranger on any status', () => {
    expect(canDecline(makeProposal(PENDING), stranger)).toBe(false)
    expect(canDecline(makeProposal(COUNTERED), stranger)).toBe(false)
  })

  it('returns false when proposal is AGREED', () => {
    expect(canDecline(makeProposal(AGREED), counterpart)).toBe(false)
  })
})

// ── canCancel ───────────────────────────────────────────────────────

describe('canCancel', () => {
  it('returns true when proposer cancels an AGREED swap', () => {
    expect(canCancel(makeProposal(AGREED), proposer)).toBe(true)
  })

  it('returns true when counterpart cancels an AGREED swap', () => {
    expect(canCancel(makeProposal(AGREED), counterpart)).toBe(true)
  })

  it('returns false when stranger tries to cancel', () => {
    expect(canCancel(makeProposal(AGREED), stranger)).toBe(false)
  })

  it('returns false when proposal is not AGREED', () => {
    expect(canCancel(makeProposal(PENDING),   proposer)).toBe(false)
    expect(canCancel(makeProposal(COUNTERED), proposer)).toBe(false)
    expect(canCancel(makeProposal(DECLINED),  proposer)).toBe(false)
    expect(canCancel(makeProposal(CANCELLED), proposer)).toBe(false)
  })
})
