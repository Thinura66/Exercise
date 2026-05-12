# Skill Swap Board — Design Spec

**Date:** 2026-05-12
**Stack:** Next.js 14 App Router · Prisma · PostgreSQL (Vercel Postgres) · NextAuth credentials
**Deploy target:** Vercel

---

## Overview

An internal web app where employees propose skill-for-skill teaching swaps. A swap only becomes agreed when both parties explicitly accept. The mechanic is mutual — closer to a friend request than a marketplace listing.

**In scope:** Email/password auth, per-user skill profile (two tag lists), proposal flow with state machine, email visibility gated on mutual agreement, cancellation post-agreement.

**Out of scope:** Scheduling, ratings, group swaps, skill taxonomy/autocomplete, notifications, mobile-native.

---

## Data Model

### User
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| email | String | Unique |
| passwordHash | String | bcrypt |
| name | String | |
| canTeach | String[] | Free-text tags, Postgres array |
| wantToLearn | String[] | Free-text tags, Postgres array |
| createdAt | DateTime | |

### Proposal
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| proposerId | String | FK → User |
| counterpartId | String | FK → User |
| offeredSkill | String | What proposer will teach |
| requestedSkill | String | What proposer wants to learn |
| status | ProposalStatus | Enum (see below) |
| counterOfferedSkill | String? | Set when COUNTERED |
| counterRequestedSkill | String? | Set when COUNTERED |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### ProposalStatus enum
```
PENDING → AGREED | DECLINED | COUNTERED
COUNTERED → AGREED | DECLINED
AGREED → CANCELLED
```

A counter updates the existing proposal row in-place (writes `counter*` fields, sets status `COUNTERED`). No new row is created. Only one counter round is allowed per proposal.

### Constraints (enforced in Server Actions, not DB)
- `offeredSkill` must exist in proposer's `canTeach`
- `requestedSkill` must exist in counterpart's `canTeach`
- `counterOfferedSkill` must exist in counterpart's `canTeach`
- `counterRequestedSkill` must exist in proposer's `canTeach`
- No duplicate open proposal between the same pair (no existing PENDING or AGREED)

---

## Routes

| Route | Auth required | Purpose |
|---|---|---|
| `/` | No | Landing; redirects to `/dashboard` if signed in |
| `/auth/signin` | No | Email + password login |
| `/auth/signup` | No | Registration (name, email, password) |
| `/dashboard` | Yes | Agreed swaps + pending sent/received proposals |
| `/profile/[userId]` | Yes | View user profile; propose swap (if not self) |
| `/profile/me` | Yes | Edit own canTeach and wantToLearn lists |

`middleware.ts` redirects unauthenticated requests on `/dashboard` and `/profile/*` to `/auth/signin`. This is a convenience redirect only — `getServerSession` is called at the top of every Server Action as the real auth boundary.

---

## Server Actions

All actions begin with `getServerSession` — unauthenticated calls throw immediately.

### `updateProfile(canTeach: string[], wantToLearn: string[])`
Replaces the current user's two tag arrays. Accepts any non-empty strings.

### `createProposal(counterpartId, offeredSkill, requestedSkill)`
1. Verify `offeredSkill` is in caller's `canTeach`
2. Verify `requestedSkill` is in counterpart's `canTeach`
3. Verify no existing PENDING or AGREED proposal between this pair
4. Create proposal with status `PENDING`

### `respondToProposal(proposalId, action: 'accept' | 'decline' | 'counter', counterSkills?)`
- **accept** — caller must be counterpart of a `PENDING` proposal → sets `AGREED`
- **decline** — caller must be counterpart of a `PENDING` proposal, or proposer of a `COUNTERED` proposal → sets `DECLINED`
- **counter** — caller must be counterpart of a `PENDING` proposal (status must not already be `COUNTERED`); validates `counterOfferedSkill` in counterpart's `canTeach` and `counterRequestedSkill` in proposer's `canTeach` → sets `COUNTERED`, writes counter fields

### `acceptCounter(proposalId)`
Caller must be the original proposer of a `COUNTERED` proposal → sets `AGREED`, promotes counter fields to primary (`offeredSkill`, `requestedSkill`).

### `cancelSwap(proposalId)`
Caller must be either party of an `AGREED` proposal → sets `CANCELLED`.

### Cache invalidation
Every mutating action calls `revalidatePath('/dashboard')` so the dashboard re-fetches without stale data.

---

## Authorization Rules

| Rule | Enforcement point |
|---|---|
| Email only visible when AGREED and viewer is a party | Prisma `select` — field excluded for non-parties at query time |
| Only counterpart can counter/accept/decline a PENDING proposal | Server Action guard |
| Only proposer can accept/decline a COUNTERED proposal | Server Action guard |
| Cancel only on AGREED proposals | Server Action guard |
| Propose: offeredSkill must be in caller's canTeach | Server Action guard |

---

## Error Handling

Server Actions return `{ success: true } | { success: false, error: string }` — no unhandled exceptions reach the client. Error strings render inline near the relevant form.

**Demo failure scenarios explicitly handled:**

| Failure | Error returned |
|---|---|
| Proposing a skill not in canTeach | `"You can only offer skills from your 'can teach' list"` |
| Non-party requests agreed swap (URL guess) | Email fields never included in response — no special error needed |
| Acting on a cancelled/closed proposal | `"This proposal is no longer open"` |

---

## UI Components

- **TagEditor** — add/remove free-text tags for profile lists
- **ProfileCard** — name, canTeach tags, wantToLearn tags
- **ProposeForm** — select offeredSkill (from my canTeach) + requestedSkill (from their canTeach); only shown on `/profile/[userId]` when viewer is not the profile owner
- **ProposalCard** — shows proposal status + contextual action buttons (accept/decline/counter for counterpart; accept counter/decline for proposer)
- **SwapCard** — agreed swap; shows both parties' emails; cancel button

---

## Testing

### Unit tests (Vitest)
Pure functions extracted from Server Actions:
- `isSkillInList(skill, list)` — used by proposal validation
- Transition guards: `canAccept`, `canCounter`, `canCancel` — each checks status + caller role

### Integration tests (Vitest + Prisma test client)
Each Server Action tested against a dedicated test Postgres DB (same schema, seeded per test). Must cover:
- Happy path: proposal → counter → accept counter → agreed
- Bad skill offer rejected before DB write
- Non-party email hidden on agreed proposal query
- Stale action (e.g., accept already-cancelled) returns error

### Manual smoke test (pre-demo)
Run both demo scenarios (happy path and three failure cases) against the Vercel preview URL. No E2E framework in scope.

---

## Demo Scenarios

**Happy path:**
1. User A profile: canTeach=[Rust], wantToLearn=[design]
2. User B profile: canTeach=[design], wantToLearn=[Rust]
3. A proposes: "I'll teach Rust, you teach design"
4. B counters: "I'll teach typography (not design broadly)"
5. A accepts the counter
6. Both dashboards show the swap as AGREED with each other's email
7. A cancels → both see CANCELLED

**Failure path:**
1. A tries to propose with a skill not in their canTeach → rejected with message
2. C (uninvolved) tries to see A+B's email by guessing the proposal URL → email not in response
3. B tries to accept a CANCELLED proposal → rejected with "no longer open"
