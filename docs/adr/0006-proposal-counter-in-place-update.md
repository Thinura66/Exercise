# ADR-0006: Counter-Proposal as In-Place Row Update

**Date:** 2026-05-12
**Status:** Accepted

## Context

When a counterpart counters a proposal, there are two modelling options:
1. Create a new `Proposal` row linked to the original
2. Update the existing row in-place with `counter*` fields

Option 1 (new row) supports unlimited counter rounds and a full negotiation history. Option 2 (in-place) is simpler but limits counter rounds to one.

The product decision was to allow **one counter round per proposal** — closer to a simple accept/decline/nudge mechanic than a full negotiation loop.

## Decision

A counter updates the **existing Proposal row in-place**:
- Sets `counterOfferedSkill` and `counterRequestedSkill`
- Sets `status = COUNTERED`
- No new row is created

`acceptCounter` promotes the counter fields to primary (`offeredSkill`, `requestedSkill`) and clears the counter fields.

## Consequences

**Positive:**
- Simple schema — no self-referential FK or linked rows
- Dashboard queries are straightforward: one row per swap pair
- Prevents negotiation loops that could stall agreements indefinitely

**Negative:**
- The original proposed skills are overwritten when a counter is accepted — no history retained
- Only one counter round is possible; extending to multiple rounds would require a schema change
