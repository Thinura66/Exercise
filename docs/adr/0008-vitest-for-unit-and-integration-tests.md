# ADR-0008: Vitest for Both Unit and Integration Tests

**Date:** 2026-05-12
**Status:** Accepted

## Context

The project needs two test layers:
- **Unit tests** for pure guard functions (no DB, fast feedback)
- **Integration tests** for Server Actions against a real Postgres database

Options for integration tests:
- Jest + `pg` test client
- Vitest + Prisma test client
- Playwright for E2E

E2E testing (Playwright, Cypress) was explicitly out of scope for the initial delivery.

## Decision

Use **Vitest 4 for both unit and integration tests** with separate configs:
- `vitest.config.ts` — unit tests only (`tests/unit/`)
- `vitest.integration.config.ts` — integration tests (`tests/integration/`) against `TEST_DATABASE_URL`

Integration test setup runs `prisma db push --force-reset` before each test run to ensure a clean schema.

Seed helpers in `tests/integration/helpers.ts` provide `createTestUser()` and `createTestProposal()` for test isolation.

## Consequences

**Positive:**
- Single test runner and assertion library for both layers — no context switching
- Unit tests run in ~300ms with no DB dependency
- Integration tests hit a real Postgres schema — no mock divergence risk
- `TEST_DATABASE_URL` in `.env.test` keeps test DB isolated from development DB

**Negative:**
- Integration tests require a running Postgres instance — not runnable offline or in CI without a DB service
- `prisma db push --force-reset` drops and recreates the test schema on every run — destructive if pointed at the wrong DB
