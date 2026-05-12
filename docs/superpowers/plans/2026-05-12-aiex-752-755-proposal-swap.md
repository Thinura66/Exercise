# AIEX-752–755 — Proposal & Swap Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full proposal lifecycle: create proposal, accept/decline/counter, accept counter, and cancel agreed swap — including Proposal schema, four Server Actions, and three UI components.

**Architecture:** All business logic lives in `actions/proposals.ts`. Components are `'use client'` and use `useActionState` to surface errors inline. The state machine (PENDING → AGREED|DECLINED|COUNTERED → AGREED|DECLINED; AGREED → CANCELLED) is enforced in Server Action guards. All mutations call `revalidatePath('/dashboard')`.

**Tech Stack:** Next.js 16, React 19, Prisma 7 (pg adapter), NextAuth v5, TypeScript strict, Tailwind CSS

---

### Task 1: Prisma Schema — Add Proposal Model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update `prisma/schema.prisma`**

Replace the entire file with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

enum ProposalStatus {
  PENDING
  AGREED
  DECLINED
  COUNTERED
  CANCELLED
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  canTeach     String[]
  wantToLearn  String[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  proposalsAsProposer    Proposal[] @relation("ProposalProposer")
  proposalsAsCounterpart Proposal[] @relation("ProposalCounterpart")
}

model Proposal {
  id                    String         @id @default(cuid())
  proposerId            String
  counterpartId         String
  offeredSkill          String
  requestedSkill        String
  status                ProposalStatus @default(PENDING)
  counterOfferedSkill   String?
  counterRequestedSkill String?
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  proposer    User @relation("ProposalProposer",    fields: [proposerId],    references: [id])
  counterpart User @relation("ProposalCounterpart", fields: [counterpartId], references: [id])
}
```

- [ ] **Step 2: Push schema to database**

```bash
npx prisma db push
```

Expected output ends with:
```
Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

If you see a migration conflict, run `npx prisma db push --force-reset` (development only — this drops and recreates all tables).

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(AIEX-752): add Proposal model and ProposalStatus enum to Prisma schema"
```

---

### Task 2: Proposal Server Actions

**Files:**
- Create: `actions/proposals.ts`

- [ ] **Step 1: Create `actions/proposals.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { ProposalStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-helpers'

export type ProposalActionState = { success: false; error: string } | null

// ─── createProposal ────────────────────────────────────────────────

export async function createProposal(
  _prev: ProposalActionState,
  formData: FormData,
): Promise<ProposalActionState> {
  const userIdOrError = await getAuthenticatedUserId()
  if (typeof userIdOrError !== 'string') return userIdOrError

  const counterpartId = formData.get('counterpartId') as string
  const offeredSkill = formData.get('offeredSkill') as string
  const requestedSkill = formData.get('requestedSkill') as string

  if (!counterpartId || !offeredSkill || !requestedSkill) {
    return { success: false, error: 'All fields are required.' }
  }

  const [caller, counterpart] = await Promise.all([
    prisma.user.findUnique({ where: { id: userIdOrError }, select: { canTeach: true } }),
    prisma.user.findUnique({ where: { id: counterpartId }, select: { canTeach: true } }),
  ])

  if (!caller?.canTeach.includes(offeredSkill)) {
    return { success: false, error: "You can only offer skills from your 'can teach' list" }
  }
  if (!counterpart?.canTeach.includes(requestedSkill)) {
    return { success: false, error: "That skill is not in the other user's 'can teach' list" }
  }

  const existing = await prisma.proposal.findFirst({
    where: {
      OR: [
        { proposerId: userIdOrError, counterpartId },
        { proposerId: counterpartId, counterpartId: userIdOrError },
      ],
      status: { in: [ProposalStatus.PENDING, ProposalStatus.AGREED] },
    },
  })
  if (existing) {
    return { success: false, error: 'A proposal is already open between you and this user' }
  }

  await prisma.proposal.create({
    data: {
      proposerId: userIdOrError,
      counterpartId,
      offeredSkill,
      requestedSkill,
    },
  })

  revalidatePath('/dashboard')
  return null
}

// ─── respondToProposal ─────────────────────────────────────────────

export async function respondToProposal(
  _prev: ProposalActionState,
  formData: FormData,
): Promise<ProposalActionState> {
  const userIdOrError = await getAuthenticatedUserId()
  if (typeof userIdOrError !== 'string') return userIdOrError

  const proposalId = formData.get('proposalId') as string
  const action = formData.get('action') as 'accept' | 'decline' | 'counter'
  const counterOfferedSkill = (formData.get('counterOfferedSkill') as string | null) ?? ''
  const counterRequestedSkill = (formData.get('counterRequestedSkill') as string | null) ?? ''

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      proposer: { select: { canTeach: true } },
      counterpart: { select: { canTeach: true } },
    },
  })

  if (!proposal) return { success: false, error: 'Proposal not found.' }

  const isProposer = proposal.proposerId === userIdOrError
  const isCounterpart = proposal.counterpartId === userIdOrError

  if (!isProposer && !isCounterpart) {
    return { success: false, error: 'You are not authorised to act on this proposal' }
  }

  if (action === 'accept') {
    if (!isCounterpart || proposal.status !== ProposalStatus.PENDING) {
      return { success: false, error: 'This proposal is no longer open' }
    }
    await prisma.proposal.update({ where: { id: proposalId }, data: { status: ProposalStatus.AGREED } })
  }

  if (action === 'decline') {
    const canDecline =
      (isCounterpart && proposal.status === ProposalStatus.PENDING) ||
      (isProposer && proposal.status === ProposalStatus.COUNTERED)
    if (!canDecline) {
      return { success: false, error: 'This proposal is no longer open' }
    }
    await prisma.proposal.update({ where: { id: proposalId }, data: { status: ProposalStatus.DECLINED } })
  }

  if (action === 'counter') {
    if (!isCounterpart || proposal.status !== ProposalStatus.PENDING) {
      return { success: false, error: 'This proposal is no longer open' }
    }
    if (!counterOfferedSkill || !counterRequestedSkill) {
      return { success: false, error: 'Both counter skills are required.' }
    }
    if (!proposal.counterpart.canTeach.includes(counterOfferedSkill)) {
      return { success: false, error: "You can only offer skills from your 'can teach' list" }
    }
    if (!proposal.proposer.canTeach.includes(counterRequestedSkill)) {
      return { success: false, error: "That skill is not in the proposer's 'can teach' list" }
    }
    await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: ProposalStatus.COUNTERED,
        counterOfferedSkill,
        counterRequestedSkill,
      },
    })
  }

  revalidatePath('/dashboard')
  return null
}

// ─── acceptCounter ─────────────────────────────────────────────────

export async function acceptCounter(
  _prev: ProposalActionState,
  formData: FormData,
): Promise<ProposalActionState> {
  const userIdOrError = await getAuthenticatedUserId()
  if (typeof userIdOrError !== 'string') return userIdOrError

  const proposalId = formData.get('proposalId') as string

  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } })

  if (!proposal) return { success: false, error: 'Proposal not found.' }
  if (proposal.proposerId !== userIdOrError) {
    return { success: false, error: 'You are not authorised to act on this proposal' }
  }
  if (proposal.status !== ProposalStatus.COUNTERED) {
    return { success: false, error: 'This proposal is no longer open' }
  }

  await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      status: ProposalStatus.AGREED,
      offeredSkill: proposal.counterOfferedSkill!,
      requestedSkill: proposal.counterRequestedSkill!,
      counterOfferedSkill: null,
      counterRequestedSkill: null,
    },
  })

  revalidatePath('/dashboard')
  return null
}

// ─── cancelSwap ────────────────────────────────────────────────────

export async function cancelSwap(
  _prev: ProposalActionState,
  formData: FormData,
): Promise<ProposalActionState> {
  const userIdOrError = await getAuthenticatedUserId()
  if (typeof userIdOrError !== 'string') return userIdOrError

  const proposalId = formData.get('proposalId') as string

  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } })

  if (!proposal) return { success: false, error: 'Proposal not found.' }

  const isParty = proposal.proposerId === userIdOrError || proposal.counterpartId === userIdOrError
  if (!isParty) {
    return { success: false, error: 'You are not authorised to act on this proposal' }
  }
  if (proposal.status !== ProposalStatus.AGREED) {
    return { success: false, error: 'This proposal is no longer open' }
  }

  await prisma.proposal.update({ where: { id: proposalId }, data: { status: ProposalStatus.CANCELLED } })

  revalidatePath('/dashboard')
  return null
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add actions/proposals.ts
git commit -m "feat(AIEX-752-755): add createProposal, respondToProposal, acceptCounter, cancelSwap Server Actions"
```

---

### Task 3: ProposeForm Component

**Files:**
- Create: `components/ProposeForm.tsx`

- [ ] **Step 1: Create `components/ProposeForm.tsx`**

```tsx
'use client'

import { useActionState } from 'react'
import { createProposal, type ProposalActionState } from '@/actions/proposals'

interface Props {
  counterpartId: string
  callerCanTeach: string[]
  targetCanTeach: string[]
}

export default function ProposeForm({ counterpartId, callerCanTeach, targetCanTeach }: Props) {
  const [state, formAction, pending] = useActionState<ProposalActionState, FormData>(
    createProposal,
    null,
  )

  if (callerCanTeach.length === 0 || targetCanTeach.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md mt-4">
        <h2 className="text-lg font-semibold mb-2">Propose a Swap</h2>
        <p className="text-sm text-gray-500">
          {callerCanTeach.length === 0
            ? 'Add skills to your profile before proposing a swap.'
            : 'This user has no skills listed yet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md mt-4">
      <h2 className="text-lg font-semibold mb-4">Propose a Swap</h2>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="counterpartId" value={counterpartId} />

        <div>
          <label htmlFor="offeredSkill" className="block text-sm font-medium text-gray-700 mb-1">
            I will teach
          </label>
          <select
            id="offeredSkill"
            name="offeredSkill"
            required
            className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a skill…</option>
            {callerCanTeach.map((skill) => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="requestedSkill" className="block text-sm font-medium text-gray-700 mb-1">
            They will teach me
          </label>
          <select
            id="requestedSkill"
            name="requestedSkill"
            required
            className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a skill…</option>
            {targetCanTeach.map((skill) => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>

        {state?.error && (
          <p role="alert" className="text-red-600 text-sm">{state.error}</p>
        )}
        {state === null && !pending && (
          // null after a successful submission — show confirmation briefly
          <></>
        )}

        <button
          type="submit"
          disabled={pending}
          aria-disabled={pending}
          className="bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Sending…' : 'Propose swap'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/ProposeForm.tsx
git commit -m "feat(AIEX-752): add ProposeForm component with skill dropdowns"
```

---

### Task 4: Update Profile Page to Use ProposeForm

**Files:**
- Modify: `app/profile/[userId]/page.tsx`

- [ ] **Step 1: Replace the file contents**

```tsx
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import ProfileCard from '@/components/ProfileCard'
import ProposeForm from '@/components/ProposeForm'

interface Props {
  params: Promise<{ userId: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params
  const session = await auth()

  const [targetUser, sessionUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, canTeach: true, wantToLearn: true },
    }),
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { canTeach: true },
        })
      : null,
  ])

  if (!targetUser) notFound()

  const isOwnProfile = session?.user?.id === targetUser.id

  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-16 bg-gray-50 px-4">
      <ProfileCard
        name={targetUser.name}
        canTeach={targetUser.canTeach}
        wantToLearn={targetUser.wantToLearn}
      />
      {!isOwnProfile && (
        <ProposeForm
          counterpartId={targetUser.id}
          callerCanTeach={sessionUser?.canTeach ?? []}
          targetCanTeach={targetUser.canTeach}
        />
      )}
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add "app/profile/[userId]/page.tsx"
git commit -m "feat(AIEX-752): replace ProposeFormStub with real ProposeForm on profile page"
```

---

### Task 5: ProposalCard Component

**Files:**
- Create: `components/ProposalCard.tsx`

- [ ] **Step 1: Create `components/ProposalCard.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { ProposalStatus } from '@prisma/client'
import { respondToProposal, acceptCounter, type ProposalActionState } from '@/actions/proposals'

interface Proposal {
  id: string
  offeredSkill: string
  requestedSkill: string
  status: ProposalStatus
  counterOfferedSkill: string | null
  counterRequestedSkill: string | null
  proposerId: string
  counterpartId: string
}

interface Props {
  proposal: Proposal
  viewerId: string
  counterpartCanTeach?: string[]
  proposerCanTeach?: string[]
}

export default function ProposalCard({
  proposal,
  viewerId,
  counterpartCanTeach = [],
  proposerCanTeach = [],
}: Props) {
  const [showCounterForm, setShowCounterForm] = useState(false)

  const [respondState, respondAction, respondPending] = useActionState<ProposalActionState, FormData>(
    respondToProposal,
    null,
  )
  const [acceptCounterState, acceptCounterAction, acceptCounterPending] = useActionState<ProposalActionState, FormData>(
    acceptCounter,
    null,
  )

  const isProposer = viewerId === proposal.proposerId
  const isCounterpart = viewerId === proposal.counterpartId

  const error = respondState?.error ?? acceptCounterState?.error

  return (
    <div className="bg-white rounded-xl shadow-md p-5 w-full">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm text-gray-500">You offer</p>
          <p className="font-semibold">{isProposer ? proposal.offeredSkill : proposal.requestedSkill}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">They offer</p>
          <p className="font-semibold">{isProposer ? proposal.requestedSkill : proposal.offeredSkill}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-3 capitalize">Status: {proposal.status.toLowerCase()}</p>

      {error && <p role="alert" className="text-red-600 text-sm mb-3">{error}</p>}

      {/* Counterpart of a PENDING proposal */}
      {isCounterpart && proposal.status === ProposalStatus.PENDING && (
        <div className="flex flex-col gap-2">
          {!showCounterForm ? (
            <div className="flex gap-2">
              <form action={respondAction}>
                <input type="hidden" name="proposalId" value={proposal.id} />
                <input type="hidden" name="action" value="accept" />
                <button type="submit" disabled={respondPending}
                  className="bg-emerald-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                  Accept
                </button>
              </form>
              <form action={respondAction}>
                <input type="hidden" name="proposalId" value={proposal.id} />
                <input type="hidden" name="action" value="decline" />
                <button type="submit" disabled={respondPending}
                  className="bg-red-100 text-red-700 text-sm px-3 py-1.5 rounded-lg hover:bg-red-200 disabled:opacity-50">
                  Decline
                </button>
              </form>
              <button type="button" onClick={() => setShowCounterForm(true)}
                className="bg-amber-100 text-amber-700 text-sm px-3 py-1.5 rounded-lg hover:bg-amber-200">
                Counter
              </button>
            </div>
          ) : (
            <form action={respondAction} className="flex flex-col gap-2">
              <input type="hidden" name="proposalId" value={proposal.id} />
              <input type="hidden" name="action" value="counter" />
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">I will teach instead</label>
                <select name="counterOfferedSkill" required
                  className="border rounded px-2 py-1.5 text-sm w-full">
                  <option value="">Select…</option>
                  {counterpartCanTeach.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">I want to learn instead</label>
                <select name="counterRequestedSkill" required
                  className="border rounded px-2 py-1.5 text-sm w-full">
                  <option value="">Select…</option>
                  {proposerCanTeach.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={respondPending}
                  className="bg-amber-500 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-amber-600 disabled:opacity-50">
                  Send counter
                </button>
                <button type="button" onClick={() => setShowCounterForm(false)}
                  className="text-gray-500 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Proposer of a PENDING proposal — waiting */}
      {isProposer && proposal.status === ProposalStatus.PENDING && (
        <p className="text-sm text-gray-400 italic">Awaiting response…</p>
      )}

      {/* Proposer of a COUNTERED proposal */}
      {isProposer && proposal.status === ProposalStatus.COUNTERED && (
        <div className="flex flex-col gap-2">
          <div className="bg-amber-50 rounded p-3 text-sm mb-1">
            <p className="font-medium text-amber-800 mb-1">Counter offer received</p>
            <p>They will teach: <span className="font-semibold">{proposal.counterOfferedSkill}</span></p>
            <p>They want to learn: <span className="font-semibold">{proposal.counterRequestedSkill}</span></p>
          </div>
          <div className="flex gap-2">
            <form action={acceptCounterAction}>
              <input type="hidden" name="proposalId" value={proposal.id} />
              <button type="submit" disabled={acceptCounterPending}
                className="bg-emerald-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                Accept counter
              </button>
            </form>
            <form action={respondAction}>
              <input type="hidden" name="proposalId" value={proposal.id} />
              <input type="hidden" name="action" value="decline" />
              <button type="submit" disabled={respondPending}
                className="bg-red-100 text-red-700 text-sm px-3 py-1.5 rounded-lg hover:bg-red-200 disabled:opacity-50">
                Decline
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/ProposalCard.tsx
git commit -m "feat(AIEX-753,AIEX-754): add ProposalCard with contextual action buttons"
```

---

### Task 6: SwapCard Component

**Files:**
- Create: `components/SwapCard.tsx`

- [ ] **Step 1: Create `components/SwapCard.tsx`**

```tsx
'use client'

import { useActionState } from 'react'
import { cancelSwap, type ProposalActionState } from '@/actions/proposals'

interface Props {
  proposal: {
    id: string
    offeredSkill: string
    requestedSkill: string
    proposer: { id: string; name: string; email: string }
    counterpart: { id: string; name: string; email: string }
  }
  viewerId: string
}

export default function SwapCard({ proposal, viewerId }: Props) {
  const [state, formAction, pending] = useActionState<ProposalActionState, FormData>(
    cancelSwap,
    null,
  )

  const isProposer = viewerId === proposal.proposer.id
  const myParty = isProposer ? proposal.proposer : proposal.counterpart
  const otherParty = isProposer ? proposal.counterpart : proposal.proposer

  return (
    <div className="bg-white rounded-xl shadow-md p-5 w-full">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">You teach</p>
          <p className="font-semibold">{isProposer ? proposal.offeredSkill : proposal.requestedSkill}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">They teach you</p>
          <p className="font-semibold">{isProposer ? proposal.requestedSkill : proposal.offeredSkill}</p>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        <p><span className="font-medium">Your email:</span> {myParty.email}</p>
        <p><span className="font-medium">{otherParty.name}&apos;s email:</span> {otherParty.email}</p>
      </div>

      {state?.error && (
        <p role="alert" className="text-red-600 text-sm mb-2">{state.error}</p>
      )}

      <form action={formAction}>
        <input type="hidden" name="proposalId" value={proposal.id} />
        <button
          type="submit"
          disabled={pending}
          aria-disabled={pending}
          className="text-red-600 text-sm border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
        >
          {pending ? 'Cancelling…' : 'Cancel swap'}
        </button>
      </form>
    </div>
  )
}
```

Note: SwapCard receives `proposer` and `counterpart` with `email` fields. These are populated from Prisma queries that select `email` from User — only safe to include when the viewer is confirmed to be a party (enforced in the Dashboard query that builds this component's props).

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/SwapCard.tsx
git commit -m "feat(AIEX-755): add SwapCard component with cancel button"
```

---

### Task 7: Manual Smoke Tests

Start the dev server: `npm run dev`. Use two browser sessions (different accounts) to test the full flow.

**Setup:** Ensure User A and User B both have skills in their canTeach lists. User A teaches "Rust", User B teaches "design".

**AIEX-752 — Create proposal:**

- [ ] User A navigates to `/profile/<User-B-id>` → ProposeForm shows. offeredSkill dropdown has "Rust", requestedSkill dropdown has "design".
- [ ] User A selects both and clicks "Propose swap" → proposal created (verify via `npx prisma studio` → Proposal table shows PENDING row).
- [ ] User A tries again → inline error "A proposal is already open between you and this user".

**AIEX-753 — Respond to proposal:**

- [ ] User B signs in. On their dashboard (stub for now — check Prisma Studio to confirm) the PENDING proposal exists.
- [ ] Manually confirm `respondToProposal` works by testing the action directly or via the dashboard once built.
- [ ] For counter: call `respondToProposal` with action='counter' and valid counter skills → status COUNTERED in DB.
- [ ] For accept: status → AGREED.

**AIEX-754 — Accept counter:**

- [ ] Create a COUNTERED proposal in DB (via Prisma Studio or counter flow). User A calls acceptCounter → status AGREED, counter fields promoted to primary.

**AIEX-755 — Cancel swap:**

- [ ] Create an AGREED proposal. Either party calls cancelSwap → status CANCELLED.
- [ ] Verify third party cannot cancel.

Note: Full UI smoke testing of ProposalCard and SwapCard will be completed in the Dashboard epic (AIEX-756/757) when the dashboard page is built. Server Action correctness can be verified via Prisma Studio.

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat(AIEX-752-755): proposal and swap flow complete"
```
