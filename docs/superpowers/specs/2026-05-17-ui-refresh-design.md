# UI Refresh — Design Spec

**Date:** 2026-05-17
**Status:** Approved

## Overview

Full UI refresh of the Skill Swap Board app. The goal is a more user-friendly experience across all pages. The dark amber theme (`#0f172a` background, `#f59e0b` accent) is preserved throughout.

The primary structural change is replacing the top navigation bar with a **persistent sidebar** on all authenticated pages, and splitting the dashboard's proposal/colleague sections into dedicated pages.

---

## Page Inventory

| Route | Status | Change |
|---|---|---|
| `/` | existing | Refined — see Landing section |
| `/auth/signin` | existing | Minor alignment only |
| `/auth/signup` | existing | Minor alignment only |
| `/dashboard` | existing | Restructured — stats + attention items only |
| `/proposals` | **new** | Replaces proposal sections on dashboard |
| `/colleagues` | **new** | Replaces matched colleagues section on dashboard |
| `/profile/me` | existing | Wrapped in sidebar shell |
| `/profile/[userId]` | existing | Wrapped in sidebar shell |

---

## 1. Landing Page `/`

**Approach:** Refine, don't rebuild. Same hero/feature-card structure, tightened up.

**Nav bar:**
- Logo + "Skill Swap Board" wordmark on the left
- Single CTA on the right: **"Get started →"** (amber primary button)
- No "Sign in" button in the nav

**Hero section:**
- Badge: "✦ Internal knowledge exchange platform"
- Headline: "Teach what you know. / Learn what you don't." (serif, amber accent on second line)
- Subtext: existing copy
- CTA row: **"Create your account →"** (primary) + **"Sign in"** (ghost) side by side

**Feature grid:** 3 cards unchanged (Share expertise, Mutual exchange, Direct connection)

---

## 2. Auth Pages `/auth/signin` and `/auth/signup`

**Approach:** Layout unchanged (split-panel: brand left, form right). Font sizes and spacing aligned with the rest of the refresh. No structural changes.

---

## 3. Shared Sidebar Shell

All authenticated pages (`/dashboard`, `/proposals`, `/colleagues`, `/profile/me`, `/profile/[userId]`) use a shared sidebar layout.

**Sidebar (200px wide, `#0a1628` background):**
- Top: logo mark + "Skill Swap / Board" wordmark
- Nav items (icon + label):
  - ⊞ Dashboard
  - 📬 Proposals — amber badge showing count of actionable items (received + counter offers)
  - 👥 Colleagues
  - 👤 My Profile
- Active item: amber background tint + amber text
- Bottom: user avatar (initial), name, role, sign-out button (↩)

---

## 4. Dashboard `/dashboard`

**Purpose:** Summary view only. Not a full proposal list — that lives in `/proposals`.

**Page header:** "Good day, [FirstName]." + subtitle showing count of active items.

**Stats row (4 cards):**
- Active Swaps (amber accent when > 0)
- Received
- Counter Offers
- Sent

**Needs Attention section:**
- Shows only items requiring a response: received proposals + counter offers
- Each card: left-colored border (amber = received, purple = counter), proposer name, skill swap details, action buttons (Accept / Counter / Decline)
- Footer link: "See all proposals in Proposals →"

**Empty state:** "Everything is up to date. Browse colleagues to propose new swaps."

---

## 5. Proposals Page `/proposals` *(new)*

**Purpose:** Full inbox for all proposal states.

**Tabs:** Received · Counter Offers · Sent · Agreed (each with a count badge)

**Per-item layout:**
- Avatar (initial), name, skill tags (amber = offered, green = requested), timestamp
- Action buttons contextual to tab:
  - Received: Accept / Counter / Decline
  - Counter Offers: Accept / Decline
  - Sent: (read-only, shows status)
  - Agreed: (read-only, shows partner + skills)

**Empty state per tab:** e.g. "No incoming proposals right now."

---

## 6. Colleagues Page `/colleagues` *(new)*

**Purpose:** Browse all teammates, find matches, propose swaps.

**Search bar:** text input filtering by name or skill, match count badge on right.

**Per-colleague row:**
- Avatar, name, "✓ matches your goals" green badge (if their `canTeach` overlaps with viewer's `wantToLearn`)
- Skill tags (amber)
- "Propose swap →" button linking to `/profile/[userId]`

**Empty state:** "No colleagues found. Update your learning goals to see matches."

---

## 7. Profile Pages `/profile/me` and `/profile/[userId]`

**My Profile (`/profile/me`):** Two-column grid inside sidebar shell.
- Left: ProfileCard component (avatar, Can Teach tags, Wants to Learn tags) — unchanged
- Right: Edit form (TagEditor inputs for canTeach and wantToLearn, Save button)

**Colleague Profile (`/profile/[userId]`):** Same sidebar shell, existing layout (ProfileCard + ProposeForm or "this is you" notice). Breadcrumb: Dashboard › [Name]'s profile.

---

## New Routes Required

Two new Next.js page files need to be created:

- `app/proposals/page.tsx` — server component, fetches all proposal states for the authenticated user, renders tabbed UI
- `app/colleagues/page.tsx` — server component, fetches all users + matches against viewer's `wantToLearn`, renders searchable list

The search/filter on `/colleagues` can be client-side (no new API needed) since the full list is fetched server-side and filtered in the browser.

---

## Shared Layout

A new `app/(app)/layout.tsx` route group layout wraps all authenticated pages with the sidebar shell, replacing the per-page `AppHeader` usage. The `AppHeader` component becomes unused and can be deleted once all pages are migrated.

---

## What Is Not Changing

- Color palette and fonts — dark amber theme preserved exactly
- Auth logic — no changes to NextAuth config, session handling, or server actions
- Proposal lifecycle — no changes to guards, status transitions, or DB schema
- `ProposalCard` and `SwapCard` components — reused as-is inside the new Proposals page
- `ProfileCard` and `ProposeForm` — reused as-is
