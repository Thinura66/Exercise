# Proposal Flow UI Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a success confirmation screen to ProposeForm, and add a matched colleague list to the dashboard so users can start proposals without leaving the page.

**Architecture:** Two independent changes. Task 1 extends `ProposalActionState` with `{ success: true }` and adds a success screen to `ProposeForm`. Task 2 adds a Prisma query for skill-matched users to the dashboard `Promise.all` and renders a "Browse Colleagues" section. No new files, no new routes.

**Tech Stack:** Next.js 16 App Router, React Server Components, `useActionState`, Prisma 7, Tailwind CSS 4, Studio Dark theme (`#0f172a` bg, `#1e293b` card, `#f59e0b` amber, `#22c55e` green)

---

## File Map

| File | Change |
|------|--------|
| `actions/proposals.ts:9` | Extend `ProposalActionState` type; return `{ success: true }` from `createProposal` |
| `components/ProposeForm.tsx` | Render success screen when `state?.success === true`; remove dead line 112 |
| `app/dashboard/page.tsx` | Add `matchedColleagues` query to `Promise.all`; add Browse Colleagues section |

---

## Task 1: ProposeForm success state

**Files:**
- Modify: `actions/proposals.ts:9`
- Modify: `components/ProposeForm.tsx`

- [ ] **Step 1: Update ProposalActionState type in actions/proposals.ts**

Find line 9:
```ts
export type ProposalActionState = { success: false; error: string } | null
```

Replace with:
```ts
export type ProposalActionState = { success: true } | { success: false; error: string } | null
```

- [ ] **Step 2: Change createProposal to return { success: true } on success**

Find the final line of `createProposal` (currently `return null` after `revalidatePath('/dashboard')`):

```ts
  revalidatePath('/dashboard')
  return null
```

Replace with:
```ts
  revalidatePath('/dashboard')
  return { success: true }
```

- [ ] **Step 3: Run the unit tests to confirm nothing broke**

```bash
npm run test
```
Expected: 24 passed — the type change is backward-compatible because the other actions still return `null`.

- [ ] **Step 4: Replace ProposeForm content with success screen logic**

Open `components/ProposeForm.tsx`. Replace the entire file content with:

```tsx
'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { createProposal, type ProposalActionState } from '@/actions/proposals'

const selectStyle = {
  background: '#0f172a',
  border: '1px solid #334155',
  color: '#f8fafc',
  outline: 'none',
}

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
      <div
        className="rounded-2xl p-6"
        style={{ background: '#1e293b', border: '1px solid #334155' }}
      >
        <h2 className="text-sm font-semibold mb-2" style={{ color: '#f8fafc' }}>Propose a Swap</h2>
        <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
          {callerCanTeach.length === 0
            ? '⚠ Add skills to your profile before proposing a swap.'
            : '⚠ This user has no skills listed yet — they need to update their profile.'}
        </p>
      </div>
    )
  }

  if (state?.success === true) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{ background: '#1e293b', border: '1px solid #334155' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />
          <h2 className="text-sm font-semibold" style={{ color: '#f8fafc' }}>Propose a Swap</h2>
        </div>
        <div
          className="rounded-xl p-6 text-center"
          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <div className="text-2xl mb-3" style={{ color: '#22c55e' }}>✓</div>
          <p className="text-sm font-semibold mb-1" style={{ color: '#22c55e' }}>Proposal sent!</p>
          <p className="text-xs leading-relaxed mb-4" style={{ color: '#64748b' }}>
            Check your dashboard to track the response.
          </p>
          <Link
            href="/dashboard"
            className="text-xs font-semibold"
            style={{ color: '#f59e0b' }}
          >
            Go to dashboard →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: '#1e293b', border: '1px solid #334155' }}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />
        <h2 className="text-sm font-semibold" style={{ color: '#f8fafc' }}>Propose a Swap</h2>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="counterpartId" value={counterpartId} />

        <div>
          <label htmlFor="offeredSkill" className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
            I will teach
          </label>
          <select
            id="offeredSkill"
            name="offeredSkill"
            required
            className="w-full px-3 py-2.5 text-sm rounded-lg transition-all"
            style={selectStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(245,158,11,0.15)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <option value="">Select a skill…</option>
            {callerCanTeach.map((skill) => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-center">
          <div className="text-lg" style={{ color: '#334155' }}>⇅</div>
        </div>

        <div>
          <label htmlFor="requestedSkill" className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
            They will teach me
          </label>
          <select
            id="requestedSkill"
            name="requestedSkill"
            required
            className="w-full px-3 py-2.5 text-sm rounded-lg transition-all"
            style={selectStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34,197,94,0.15)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <option value="">Select a skill…</option>
            {targetCanTeach.map((skill) => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>

        {state?.error && (
          <div
            role="alert"
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          aria-disabled={pending}
          className="w-full py-2.5 text-sm font-semibold rounded-lg transition-all mt-1"
          style={{
            background: pending ? '#92400e' : 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#0f172a',
            opacity: pending ? 0.7 : 1,
            cursor: pending ? 'not-allowed' : 'pointer',
          }}
        >
          {pending ? 'Sending proposal…' : 'Send swap proposal →'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add actions/proposals.ts components/ProposeForm.tsx
git commit -m "feat: show success confirmation screen in ProposeForm after proposal sent"
```

---

## Task 2: Matched colleague list on dashboard

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Add matchedColleagues to the Promise.all destructure**

Find this line in `app/dashboard/page.tsx`:
```ts
  const [sessionUser, agreedProposals, sentProposals, receivedProposals, counterPendingProposals] =
    await Promise.all([
```

Replace with:
```ts
  const [sessionUser, agreedProposals, sentProposals, receivedProposals, counterPendingProposals, matchedColleagues] =
    await Promise.all([
```

- [ ] **Step 2: Add the matchedColleagues query as the 6th item in Promise.all**

Find the closing of the last Prisma query in `Promise.all` (the `counterPendingProposals` query ends with `]),`). Add the new query after it, before the closing `])`:

The current end of Promise.all looks like:
```ts
      prisma.proposal.findMany({
        where: { proposerId: userId, status: ProposalStatus.COUNTERED },
        orderBy: { updatedAt: 'desc' },
      }),
    ])
```

Replace with:
```ts
      prisma.proposal.findMany({
        where: { proposerId: userId, status: ProposalStatus.COUNTERED },
        orderBy: { updatedAt: 'desc' },
      }),

      prisma.user.findMany({
        where: {
          id: { not: userId },
          canTeach: { hasSome: sessionUser?.wantToLearn ?? [] },
        },
        select: { id: true, name: true, canTeach: true },
        orderBy: { name: 'asc' },
      }),
    ])
```

> **Note:** `sessionUser` is fetched in the same `Promise.all`. Prisma resolves all queries in parallel, but `sessionUser?.wantToLearn` is evaluated when the array is constructed — at that point `sessionUser` is still `undefined`. Fix this by running `matchedColleagues` in a separate `await` after the first `Promise.all` resolves (see Step 3).

- [ ] **Step 3: Split into two awaits to fix the sessionUser dependency**

The `matchedColleagues` query depends on `sessionUser.wantToLearn`, which isn't available until the first `Promise.all` resolves. Split it out:

Replace the entire `Promise.all` block with:

```ts
  const [sessionUser, agreedProposals, sentProposals, receivedProposals, counterPendingProposals] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, canTeach: true, wantToLearn: true } }),

      prisma.proposal.findMany({
        where: {
          OR: [{ proposerId: userId }, { counterpartId: userId }],
          status: ProposalStatus.AGREED,
        },
        include: {
          proposer: { select: { id: true, name: true, email: true } },
          counterpart: { select: { id: true, name: true, email: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),

      prisma.proposal.findMany({
        where: { proposerId: userId, status: ProposalStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      }),

      prisma.proposal.findMany({
        where: { counterpartId: userId, status: ProposalStatus.PENDING },
        include: {
          proposer: { select: { id: true, canTeach: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),

      prisma.proposal.findMany({
        where: { proposerId: userId, status: ProposalStatus.COUNTERED },
        orderBy: { updatedAt: 'desc' },
      }),
    ])

  const wantToLearn = sessionUser?.wantToLearn ?? []

  const matchedColleagues = wantToLearn.length > 0
    ? await prisma.user.findMany({
        where: {
          id: { not: userId },
          canTeach: { hasSome: wantToLearn },
        },
        select: { id: true, name: true, canTeach: true },
        orderBy: { name: 'asc' },
      })
    : []
```

- [ ] **Step 4: Add the Browse Colleagues section to the JSX**

Find this comment in the `return` block:
```tsx
        {/* ── Stats row ── */}
```

Add the Browse Colleagues section **after the stats row block and before the section helper**. Find the closing `</div>` of the stats grid (it ends the stats row) and the next `{/* ── Section helper ── */}` comment. Insert between them:

```tsx
        {/* ── Browse Colleagues ── */}
        {matchedColleagues.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#f59e0b' }} />
              <div className="flex items-baseline gap-2 flex-1">
                <h2 className="text-sm font-semibold" style={{ color: '#cbd5e1' }}>Browse Colleagues</h2>
                <span className="text-xs" style={{ color: '#475569' }}>matched to your learning goals</span>
              </div>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}
              >
                {matchedColleagues.length}
              </span>
            </div>

            <div className="mb-4" style={{ height: 1, background: '#1e293b' }} />

            <div className="flex flex-col gap-3">
              {matchedColleagues.map((colleague) => {
                const matchedSkills = colleague.canTeach.filter((s) => wantToLearn.includes(s))
                const otherSkills = colleague.canTeach.filter((s) => !wantToLearn.includes(s))
                return (
                  <div
                    key={colleague.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{ background: '#1e293b', border: '1px solid #334155' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold mb-1.5" style={{ color: '#f8fafc' }}>{colleague.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedSkills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
                          >
                            {skill}
                          </span>
                        ))}
                        {otherSkills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: '#0f172a', color: '#475569', border: '1px solid #1e293b' }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link
                      href={`/profile/${colleague.id}`}
                      className="ml-4 flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
                    >
                      Propose →
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>
        )}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Run unit tests**

```bash
npm run test
```
Expected: 24 passed.

- [ ] **Step 7: Run build**

```bash
npm run build
```
Expected: `✓ Compiled successfully`.

- [ ] **Step 8: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add matched colleague list to dashboard for quick proposal access"
```

---

## Task 3: Push to remotes

- [ ] **Step 1: Push both commits**

```bash
git push origin main
```
Expected: both commits pushed to Bitbucket and GitHub.

---

## Self-Review

### Spec coverage

| Requirement | Task |
|-------------|------|
| `ProposalActionState` gains `{ success: true }` | Task 1 Step 1 |
| `createProposal` returns `{ success: true }` | Task 1 Step 2 |
| ProposeForm shows success screen when `state?.success === true` | Task 1 Step 4 |
| Dead line 112 removed | Task 1 Step 4 (full file rewrite, line absent) |
| `matchedColleagues` query uses `hasSome` against `wantToLearn` | Task 2 Step 3 |
| Section hidden when `wantToLearn` is empty | Task 2 Step 3 (`wantToLearn.length > 0` guard) |
| Matched skills highlighted amber, others muted | Task 2 Step 4 |
| "Propose →" links to `/profile/[userId]` | Task 2 Step 4 |
| Build passes | Task 2 Step 7 |

### Notes
- The `sessionUser` dependency issue (Step 3) is resolved by splitting into two sequential awaits. The second await is only reached when `wantToLearn.length > 0`, so users with no learning goals incur zero extra DB calls.
- `state?.error` check in ProposeForm uses optional chaining — safe because `{ success: true }` has no `error` field.
