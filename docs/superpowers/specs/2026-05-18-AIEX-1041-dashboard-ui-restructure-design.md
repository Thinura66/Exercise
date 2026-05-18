# AIEX-1041 — Dashboard UI Restructure Design Spec

**Date:** 2026-05-18
**Story:** [AIEX-1041](https://emblaftdev.atlassian.net/browse/AIEX-1041)
**Status:** Approved

---

## Overview

Restructure the dashboard from a full proposal listing into a focused summary view. The page shows a stats row, a compact agreed-swaps banner, and a "Needs Attention" section containing only proposals that require the viewer's immediate action. All other proposal states and the colleagues list are removed from the dashboard — they move to dedicated `/proposals` and `/colleagues` pages in a later story.

Font sizes are bumped across the board: `text-xs` secondary text moves to `text-sm`, section labels move to `text-base`.

---

## Files Changed

| File | Change |
|------|--------|
| `app/dashboard/page.tsx` | Remove full Agreed Swaps, Sent Proposals, Received Proposals, Counter Offers, and Browse Colleagues sections. Add Needs Attention section, compact agreed-swaps summary row, footer link, and font size bumps. |
| `components/StatsCard.tsx` | **New** — extracted from the inline `.map()` in the dashboard stats row |
| `components/ProposalCard.tsx` | Add optional `variant?: 'received' \| 'counter' \| 'default'` prop for left border colouring |

No new routes, no new Prisma queries, no schema changes.

---

## StatsCard Component

**File:** `components/StatsCard.tsx`

```tsx
type Props = {
  label: string
  value: number
  highlight?: boolean
}
```

- `highlight && value > 0` → amber border (`rgba(245,158,11,0.2)`) + amber number (`#f59e0b`)
- Default → slate background (`#1e293b`), white number
- Label: `text-sm` (bumped from `text-xs`)
- Number: `text-2xl font-bold` (unchanged)

Dashboard usage:
```tsx
<StatsCard label="Active Swaps"   value={agreedProposals.length} highlight />
<StatsCard label="Received"       value={receivedProposals.length} />
<StatsCard label="Counter Offers" value={counterPendingProposals.length} />
<StatsCard label="Sent"           value={sentProposals.length} />
```

---

## ProposalCard Border Variant

**File:** `components/ProposalCard.tsx`

Add `variant?: 'received' | 'counter' | 'default'` to existing props.

| Variant | Left border |
|---------|-------------|
| `'received'` | `3px solid #f59e0b` (amber) |
| `'counter'` | `3px solid #a78bfa` (purple) |
| `'default'` / omitted | none — existing behaviour preserved |

Applied to the card's outer wrapper `style` only. No changes to internal logic, actions, or existing prop types.

---

## Dashboard Restructure

### Sections removed
- Agreed Swaps (full SwapCard list)
- Received Proposals (standalone section)
- Counter Offers (standalone section)
- Sent Proposals
- Browse Colleagues

### Sections kept / added

**Greeting header** (unchanged structure, font bump)
- Subtitle: `text-xs` → `text-base`

**Stats row** — replaced inline map with `StatsCard` components (4 cards, same data queries)

**Agreed Swaps summary row** (new, compact)
- Shown only when `agreedProposals.length > 0`
- Single banner row: amber accent, shows count, links to `/proposals`
- Example: `✓ 2 active swap commitments — See all in Proposals →`

**Needs Attention section** (new)
- Renders received proposals (`ProposalCard variant="received"`) and counter offers (`ProposalCard variant="counter"`) in one unified list, ordered by `updatedAt desc`
- Section header: `text-base font-semibold`
- Empty state when no actionable items: `"Everything is up to date. Browse colleagues to propose new swaps."` at `text-base`

**Footer link** (new, always visible)
- `"See all proposals in Proposals →"` linking to `/proposals`
- `text-sm`, amber colour, right-aligned or centred below Needs Attention

### Data queries kept
All existing `prisma.proposal.findMany` calls are retained — the data is still needed for stats counts and the Needs Attention cards. The `matchedColleagues` query is removed (colleagues section removed).

---

## Font Size Bumps

| Element | Before | After |
|---------|--------|-------|
| Greeting subtitle | `text-xs` | `text-base` |
| Section labels / headings | `text-sm` | `text-base` |
| Section description text | `text-xs` | `text-sm` |
| Empty state text | `text-sm` | `text-base` |
| StatsCard labels | `text-xs` | `text-sm` |
| Nav links (header) | `text-xs` | `text-sm` |

---

## Acceptance Criteria

**AC1 — Needs Attention with data**
Given an employee with received proposals and/or counter offers, when they navigate to `/dashboard`, then the Needs Attention section shows ProposalCards with amber (received) and purple (counter) left borders and the appropriate action buttons.

**AC2 — Empty state**
Given an employee with no received proposals and no counter offers, when they navigate to `/dashboard`, then the Needs Attention section shows the empty state message "Everything is up to date. Browse colleagues to propose new swaps."

**AC3 — Agreed swaps summary**
Given an employee with at least one agreed swap, when they navigate to `/dashboard`, then the compact summary banner is visible with the correct count and links to `/proposals`.

**AC4 — Footer link**
The "See all proposals in Proposals →" link is always present on the dashboard and navigates to `/proposals`.

**AC5 — Font sizes**
All labels, subtitles, section headings, and secondary text are at least `text-sm` (14px); section headings are `text-base` (16px).
