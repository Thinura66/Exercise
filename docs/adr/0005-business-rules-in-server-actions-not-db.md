# ADR-0005: Business Rules Enforced in Server Actions, Not Database Constraints

**Date:** 2026-05-12
**Status:** Accepted

## Context

The proposal lifecycle has several business rules (skill list membership, no duplicate open proposals, role-based action guards). These could be enforced via:
- Database-level constraints (CHECK constraints, triggers)
- Application-level validation in Server Actions

## Decision

All business rules are enforced **in Server Actions**, not at the database level.

Rules enforced in code:
- `offeredSkill` must be in proposer's `canTeach`
- `requestedSkill` must be in counterpart's `canTeach`
- No existing `PENDING` or `AGREED` proposal between the same pair
- Only counterpart can accept/decline/counter a `PENDING` proposal
- Only proposer can accept/decline a `COUNTERED` proposal
- Cancel only allowed on `AGREED` proposals

Pure guard functions (`canAccept`, `canCounter`, `canDecline`, `canCancel`) live in `lib/guards.ts` and are called by Server Actions after fetching the proposal.

## Consequences

**Positive:**
- Guard logic is pure TypeScript — unit testable without a database connection
- Error messages are user-friendly strings, not raw DB constraint violations
- Guards are readable and easy to change as business rules evolve

**Negative:**
- A direct DB write bypassing the application layer would not be caught — acceptable for an internal tool
- Guards must be kept in sync with the Prisma schema's `ProposalStatus` enum
