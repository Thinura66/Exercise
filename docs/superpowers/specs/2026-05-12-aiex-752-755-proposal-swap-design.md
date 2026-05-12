# AIEX-752–755 — Proposal & Swap Flow Design

**Date:** 2026-05-12
**Stories:**
- AIEX-752 (Medium): Create proposal — ProposeForm + createProposal
- AIEX-753 (Complex): Respond to proposal — ProposalCard + respondToProposal
- AIEX-754 (Medium): Accept/decline counter — acceptCounter in respondToProposal
- AIEX-755 (Simple): Cancel swap — SwapCard + cancelSwap
**Stack:** Next.js 16, React 19, Prisma 7, NextAuth v5, Tailwind CSS

---

## State Machine

```
PENDING → AGREED      (counterpart accepts)
PENDING → DECLINED    (counterpart declines)
PENDING → COUNTERED   (counterpart counters — one round only)
COUNTERED → AGREED    (proposer acceptCounter)
COUNTERED → DECLINED  (proposer declines via respondToProposal 'decline')
AGREED → CANCELLED    (either party cancelSwap)
```

---

## File Structure

```
prisma/
  schema.prisma                 ← MODIFY: add Proposal model + ProposalStatus enum + User relations

actions/
  proposals.ts                  ← NEW: createProposal, respondToProposal, acceptCounter, cancelSwap

components/
  ProposeForm.tsx               ← NEW: offeredSkill + requestedSkill dropdowns, useActionState
  ProposalCard.tsx              ← NEW: contextual buttons by role + status, counter input toggle
  SwapCard.tsx                  ← NEW: parties' emails + cancel button

app/
  profile/
    [userId]/
      page.tsx                  ← MODIFY: replace ProposeFormStub with ProposeForm
```

---

## Prisma Schema Changes

Add to `prisma/schema.prisma`:

```prisma
enum ProposalStatus {
  PENDING
  AGREED
  DECLINED
  COUNTERED
  CANCELLED
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

Add relation fields to `User` model:
```prisma
  proposalsAsProposer    Proposal[] @relation("ProposalProposer")
  proposalsAsCounterpart Proposal[] @relation("ProposalCounterpart")
```

Run `npx prisma db push` after updating the schema.

---

## Shared Action State Type

```ts
export type ProposalActionState = { success: false; error: string } | null
```

All proposal Server Actions return `ProposalActionState`. No `{ success: true }` needed — successful mutations revalidate the dashboard and the component reflects updated state.

---

## actions/proposals.ts

### `createProposal`

```ts
export async function createProposal(
  _prev: ProposalActionState,
  formData: FormData,
): Promise<ProposalActionState>
```

Guards:
1. `getAuthenticatedUserId()` — returns error if unauthenticated
2. Parse `counterpartId`, `offeredSkill`, `requestedSkill` from formData
3. Fetch caller's canTeach — check `offeredSkill` is in it → error if not
4. Fetch counterpart's canTeach — check `requestedSkill` is in it → error if not
5. Check no existing PENDING or AGREED proposal between this pair → error if found
6. `prisma.proposal.create({ data: { proposerId, counterpartId, offeredSkill, requestedSkill, status: 'PENDING' } })`
7. `revalidatePath('/dashboard')`

Error messages:
- `"You can only offer skills from your 'can teach' list"`
- `"A proposal is already open between you and this user"`

### `respondToProposal`

```ts
export async function respondToProposal(
  _prev: ProposalActionState,
  formData: FormData,
): Promise<ProposalActionState>
```

Parses: `proposalId`, `action: 'accept' | 'decline' | 'counter'`, `counterOfferedSkill?`, `counterRequestedSkill?`

Guards by action:
- **accept**: caller = counterpart, status = PENDING → set AGREED
- **decline**: (caller = counterpart + PENDING) OR (caller = proposer + COUNTERED) → set DECLINED
- **counter**: caller = counterpart, status = PENDING (not already COUNTERED), validate counter skills, write counter fields → set COUNTERED

Error messages:
- `"You are not authorised to act on this proposal"`
- `"This proposal is no longer open"`
- `"You can only offer skills from your 'can teach' list"` (counter validation)

`revalidatePath('/dashboard')` on success.

### `acceptCounter`

```ts
export async function acceptCounter(
  _prev: ProposalActionState,
  formData: FormData,
): Promise<ProposalActionState>
```

Parses: `proposalId`

Guards: caller = original proposer, status = COUNTERED

Action: promote counter fields → `offeredSkill = counterOfferedSkill`, `requestedSkill = counterRequestedSkill`, set AGREED, clear counter fields

`revalidatePath('/dashboard')` on success.

### `cancelSwap`

```ts
export async function cancelSwap(
  _prev: ProposalActionState,
  formData: FormData,
): Promise<ProposalActionState>
```

Parses: `proposalId`

Guards: caller = proposer OR counterpart, status = AGREED

Action: set CANCELLED

Error messages:
- `"You are not authorised to act on this proposal"`
- `"This proposal is no longer open"`

`revalidatePath('/dashboard')` on success.

---

## ProposeForm — `components/ProposeForm.tsx`

`'use client'`. Props: `callerCanTeach: string[]`, `targetCanTeach: string[]`, `counterpartId: string`.

Uses `useActionState<ProposalActionState, FormData>(createProposal, null)`.

Renders:
- Hidden `<input name="counterpartId" value={counterpartId} />`
- `<select name="offeredSkill">` — options from `callerCanTeach`
- `<select name="requestedSkill">` — options from `targetCanTeach`
- Inline error from `state?.error`
- Submit button with pending state

Shown only when both skill lists are non-empty (otherwise renders a note like "Add skills to your profile before proposing").

---

## ProposalCard — `components/ProposalCard.tsx`

`'use client'`. Props:
```ts
interface ProposalCardProps {
  proposal: {
    id: string
    offeredSkill: string
    requestedSkill: string
    status: ProposalStatus
    counterOfferedSkill: string | null
    counterRequestedSkill: string | null
    proposerId: string
    counterpartId: string
  }
  viewerId: string
  counterpartCanTeach?: string[]  // needed for counter validation hint
  proposerCanTeach?: string[]     // needed for counter skill selection
}
```

State logic:
- `isProposer = viewerId === proposal.proposerId`
- `isCounterpart = viewerId === proposal.counterpartId`

Renders different action buttons:
- `PENDING + isCounterpart` → Accept / Decline / Counter buttons
- `COUNTERED + isProposer` → counter terms shown + Accept Counter / Decline buttons
- `PENDING + isProposer` → "Awaiting response" label, no buttons
- `DECLINED / CANCELLED / AGREED` → status label only (these cards won't be shown on dashboard but included for safety)

Counter section (toggled by "Counter" button click using local `useState<boolean>`):
- Two `<select>` dropdowns: counterOfferedSkill (from counterpart's canTeach) and counterRequestedSkill (from proposer's canTeach)
- Submits via `respondToProposal` with `action='counter'`

Uses two `useActionState` hooks:
- `[respondState, respondAction] = useActionState(respondToProposal, null)` — for accept/decline/counter
- `[acceptCounterState, acceptCounterAction] = useActionState(acceptCounter, null)` — for accept counter

---

## SwapCard — `components/SwapCard.tsx`

`'use client'`. Props:
```ts
interface SwapCardProps {
  proposal: {
    id: string
    offeredSkill: string
    requestedSkill: string
    proposer: { name: string; email: string }
    counterpart: { name: string; email: string }
  }
  viewerId: string
}
```

Shows both parties' names, skills, and emails. Cancel button uses `useActionState(cancelSwap, null)`.

---

## Profile Page Update — `app/profile/[userId]/page.tsx`

Replace `ProposeFormStub` with `ProposeForm`. The page needs both users' canTeach arrays:

```ts
// Fetch target user (already done)
const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { ... } })

// Fetch session user's canTeach
const sessionUser = session?.user?.id
  ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { canTeach: true } })
  : null

// Render ProposeForm instead of ProposeFormStub
{!isOwnProfile && (
  <ProposeForm
    counterpartId={userId}
    callerCanTeach={sessionUser?.canTeach ?? []}
    targetCanTeach={targetUser.canTeach}
  />
)}
```

---

## Error Handling

| Scenario | Handled by |
|---|---|
| Offering skill not in canTeach | createProposal guard → inline error |
| Duplicate open proposal | createProposal guard → inline error |
| Wrong role for action | respondToProposal / acceptCounter / cancelSwap guard → inline error |
| Wrong status for action | Same guards → "This proposal is no longer open" |
| Counter when already countered | respondToProposal counter guard → "This proposal is no longer open" |
| Unauthenticated | getAuthenticatedUserId() → ProposalActionState error |

---

## Manual Smoke Tests

### AIEX-752
- [ ] User A navigates to User B's profile → ProposeForm shown with dropdowns
- [ ] Submit valid proposal → PENDING Proposal created, success feedback
- [ ] Submit again → "A proposal is already open between you and this user"
- [ ] Offer skill not in own canTeach → "You can only offer skills from your 'can teach' list"

### AIEX-753
- [ ] User B sees ProposalCard with accept/decline/counter buttons
- [ ] Accept → status AGREED, revalidated
- [ ] Decline → status DECLINED, revalidated
- [ ] Counter with valid skills → status COUNTERED, counter fields written
- [ ] Third party acts → "You are not authorised to act on this proposal"

### AIEX-754
- [ ] User A sees COUNTERED proposal with counter terms + Accept Counter/Decline
- [ ] Accept Counter → counter fields promoted to primary, status AGREED
- [ ] Decline counter → status DECLINED

### AIEX-755
- [ ] SwapCard shows both parties' names, skills, emails
- [ ] Cancel → status CANCELLED, card removed
- [ ] Third party tries to cancel → "You are not authorised"
- [ ] Cancel already-cancelled → "This proposal is no longer open"
