# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev                 # Start development server (localhost:3000)
npm run build               # Production build
npm run lint                # ESLint
npm run test                # Unit tests (no DB required)
npm run test:watch          # Unit tests in watch mode
npm run test:integration    # Integration tests (requires TEST_DATABASE_URL in .env.test)
npm run test:coverage       # Unit test coverage
npx prisma db push          # Push schema changes to database
npx prisma studio           # Open Prisma Studio
```

To run a single test file:
```bash
npx vitest run tests/unit/guards.test.ts
```

## Architecture

**Skill Swap Board** — peer-to-peer skill exchange platform. Users propose skill swaps, negotiate via counter-offers, and commit to mutual exchanges.

### Stack

- **Next.js 16** (App Router, Server Components, Server Actions) — this is a newer version with breaking changes; always check `node_modules/next/dist/docs/` before writing any Next.js-specific code
- **NextAuth v5** (credentials provider, JWT sessions) — configured in `auth.ts`, route handler at `app/api/auth/`
- **Prisma 7** with `@prisma/adapter-pg` (PrismaPg driver adapter, not the default engine)
- **Tailwind CSS 4** (Studio Dark theme)
- **Vitest 4**

### Server Action pattern

Every authenticated Server Action must call `getAuthenticatedUserId()` from `lib/auth-helpers.ts` as its **first** statement before any DB access:

```ts
const userIdOrError = await getAuthenticatedUserId()
if (typeof userIdOrError !== 'string') return userIdOrError
const userId = userIdOrError
```

Returns the userId string on success, or `{ success: false, error: 'Unauthorized' }` to return early. See `docs/architecture/server-action-auth.md` for full details.

### Authorization guards

`lib/guards.ts` contains pure, DB-free predicate functions (`canAccept`, `canCounter`, `canDecline`, `canCancel`) that encode who may perform each lifecycle transition. Server actions call these after fetching the proposal — they never bypass them.

`lib/enums.ts` re-exports `ProposalStatus` as a plain TypeScript enum (client-safe mirror of the Prisma enum, which cannot be imported in client components).

### Proposal lifecycle

```
createProposal → PENDING
                    ├── accept (counterpart)   → AGREED → cancel (either) → CANCELLED
                    ├── counter (counterpart)  → COUNTERED → accept (proposer) → AGREED
                    └── decline (counterpart)  → DECLINED
```
COUNTERED proposals can also be declined by the **proposer** (not the counterpart).

### Testing

- **Unit tests** (`tests/unit/`) — pure functions only, no DB, runs in ~300ms
- **Integration tests** (`tests/integration/`) — hit a real Postgres DB; requires `TEST_DATABASE_URL` in `.env.test`; global setup runs `prisma db push --force-reset` before each run

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | NextAuth secret (set both to the same value) |
| `AUTH_URL` / `NEXTAUTH_URL` | App base URL |
| `TEST_DATABASE_URL` | Separate test DB (`.env.test` only) |
