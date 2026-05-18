# ADR-0007: Email Visibility Gated at Prisma Query Time

**Date:** 2026-05-12
**Status:** Accepted

## Context

Both parties' emails are only relevant after a swap is `AGREED`. Showing emails to non-parties or before agreement is a privacy concern. Options considered:
- Strip emails in application code after fetching full user objects
- Exclude email fields in the Prisma `select` at query time
- A separate permission-check function before returning the response

## Decision

Email fields are **excluded from Prisma `select` for non-parties at query time**. The email is never fetched from the database if the viewer is not a party to the swap.

For dashboard queries, email is only included in the nested user `select` when the viewer's `userId` matches either `proposerId` or `counterpartId`.

## Consequences

**Positive:**
- Email data is never in memory if the viewer has no right to see it — no risk of accidental exposure via logging or serialisation
- No post-fetch filtering logic needed; the DB returns only what the viewer is allowed to see
- Integration tests can verify email exclusion by checking the shape of the Prisma response

**Negative:**
- Query logic is slightly more complex — two variants of the user `select` depending on viewer role
- New queries that include user data must remember to apply the same pattern
