# Proposal & Swap Flow UI Updates

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two UI improvements to the Proposal & Swap Flow: (1) ProposeForm shows a success confirmation screen after a proposal is sent; (2) the dashboard shows a matched colleague list so users can initiate proposals without navigating away.

**Architecture:** Both changes are self-contained. The success state fix touches `ProposalActionState` and `ProposeForm`. The colleague list adds one Prisma query to the dashboard `Promise.all` and a new render section — no new files, no new routes.

**Tech Stack:** Next.js 16 App Router, React Server Components, Prisma 7, Tailwind CSS 4, Studio Dark theme

---

## Change 1 — ProposeForm Success State

### Problem
`createProposal` returns `null` on success. `null` is also the initial state of `useActionState`, so `ProposeForm` cannot distinguish "never submitted" from "just succeeded". Line 112 is dead code that never renders anything.

### Solution

**`actions/proposals.ts`**
- Extend `ProposalActionState`:
  ```ts
  export type ProposalActionState = { success: true } | { success: false; error: string } | null
  ```
- Change `createProposal` to return `{ success: true }` instead of `null` on success.
- All other actions (`respondToProposal`, `acceptCounter`, `cancelSwap`) continue returning `null` — unaffected.

**`components/ProposeForm.tsx`**
- When `state?.success === true`, replace the entire form with a confirmation screen:
  - Green-bordered box, `rgba(34,197,94,0.06)` background
  - Large `✓` checkmark
  - Heading: "Proposal sent!"
  - Body: "Check your dashboard to track the response."
  - Link: "Go to dashboard →" pointing to `/dashboard`
- Remove dead line 112.

---

## Change 2 — Matched Colleague List on Dashboard

### Problem
Users must navigate to `/profile/[userId]` to propose a swap. There is no way to discover or reach a colleague from the dashboard itself.

### Solution

**`app/dashboard/page.tsx`**

Add one query to the existing `Promise.all`:
```ts
prisma.user.findMany({
  where: {
    id: { not: userId },
    canTeach: { hasSome: sessionUser?.wantToLearn ?? [] },
  },
  select: { id: true, name: true, canTeach: true },
  orderBy: { name: 'asc' },
})
```

Add a new section rendered **below the stats row and above the proposal sections**:

```
── Browse Colleagues ────────────────────────────────────
  Only shows users whose canTeach overlaps your wantToLearn.
  ┌──────────────────────────────────────────────────────┐
  │ Alice Johnson                          Propose →     │
  │ Teaches: [React] [Python]                            │
  └──────────────────────────────────────────────────────┘
  ┌──────────────────────────────────────────────────────┐
  │ Bob Smith                              Propose →     │
  │ Teaches: [Go] [Kubernetes]                           │
  └──────────────────────────────────────────────────────┘
```

- Skill tags that appear in the viewer's `wantToLearn` list are highlighted in amber.
- "Propose →" is a `<Link href="/profile/[userId]">` — navigates to that user's profile where `ProposeForm` lives.
- Empty state: "No colleagues with matching skills yet — update your profile to find matches."
- Section is hidden entirely if `sessionUser?.wantToLearn` is empty.

### Filtering note
The query uses `hasSome` (Prisma array overlap). It does NOT filter out users who already have an open proposal with the viewer — that check happens in `createProposal` which returns a clear error if a proposal already exists. Keeping the list complete avoids a second expensive query and lets users see all potential matches.

---

## Files Changed

| File | Change |
|------|--------|
| `actions/proposals.ts` | Add `{ success: true }` to `ProposalActionState`; return it from `createProposal` |
| `components/ProposeForm.tsx` | Render success screen when `state?.success === true`; remove dead line 112 |
| `app/dashboard/page.tsx` | Add matched colleagues query to `Promise.all`; add Browse Colleagues section |

## Out of Scope
- Pagination of the colleague list (add later if user count grows)
- Filtering already-proposed colleagues from the list
- `/users` directory page
