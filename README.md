# Skill Swap Board

A peer-to-peer skill exchange platform where colleagues propose, negotiate, and agree on skill-for-skill teaching swaps.

## Overview

Users offer a skill they can teach in exchange for a skill they want to learn. Proposals flow through a structured negotiation lifecycle — pending, countered, agreed, or declined — before both parties commit to a mutual exchange.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Actions, RSC) |
| Language | TypeScript 5 |
| Auth | NextAuth v5 (credentials — email + bcrypt) |
| Database | PostgreSQL via Prisma 7 + `@prisma/adapter-pg` |
| Styling | Tailwind CSS 4 (Studio Dark theme) |
| Testing | Vitest 4 (unit + integration) |

## Project Structure

```
app/
  auth/signin/          # Sign-in page
  auth/signup/          # Registration page
  dashboard/            # Authenticated home — proposals & swaps
  profile/me/           # Edit your own skills
  profile/[userId]/     # View another user + send proposal
  api/auth/             # NextAuth route handler

actions/
  auth.ts               # createUser, signInUser, signOutUser
  profile.ts            # updateProfile
  proposals.ts          # createProposal, respondToProposal, acceptCounter, cancelSwap

lib/
  prisma.ts             # PrismaClient singleton (PrismaPg adapter)
  auth-helpers.ts       # getAuthenticatedUserId — shared auth guard
  guards.ts             # Pure authorization predicates (canAccept, canCounter, etc.)
  enums.ts              # ProposalStatus enum (client-safe, mirrors Prisma)

components/
  ProposeForm.tsx        # Skill-swap proposal form
  ProposalCard.tsx       # Incoming proposal with accept/decline/counter actions
  SwapCard.tsx           # Agreed swap with cancel action
  ProfileCard.tsx        # Read-only skill display
  TagEditor.tsx          # Add/remove free-text skill tags
  AppHeader.tsx          # Shared navigation header

prisma/
  schema.prisma          # User + Proposal models, ProposalStatus enum

tests/
  unit/guards.test.ts           # 24 pure-function unit tests (no DB)
  integration/proposals.test.ts # 8 integration tests against real Postgres
  integration/helpers.ts        # createTestPrisma, createUser, createProposal
  integration/setup.ts          # Global setup — prisma db push to test DB
```

## Proposal Lifecycle

```
[Alice] createProposal → PENDING
                           │
          ┌────────────────┼────────────────┐
        accept           counter          decline
          │                │                │
        AGREED          COUNTERED        DECLINED
                           │
              ┌────────────┴──────────┐
           accept counter          decline
                │
              AGREED
                │
             cancel
                │
           CANCELLED
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or [Supabase](https://supabase.com) / [Neon](https://neon.tech))

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in DATABASE_URL, AUTH_SECRET, NEXTAUTH_SECRET, AUTH_URL

# 3. Push schema to database
npx prisma db push

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth v5 secret (generate: `openssl rand -base64 32`) |
| `NEXTAUTH_SECRET` | NextAuth v4 fallback secret (same value as AUTH_SECRET) |
| `AUTH_URL` | App base URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_URL` | App base URL (same as AUTH_URL) |

## Testing

### Unit tests (no database required)

```bash
npm run test
```

Tests pure guard functions in `lib/guards.ts` — 24 tests, runs in ~300ms.

### Integration tests (requires a test database)

```bash
# 1. Create a separate test database
# 2. Add TEST_DATABASE_URL to .env.test
echo 'TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/skillswap_test' > .env.test

# 3. Run integration tests
npm run test:integration
```

The global setup automatically runs `prisma db push --force-reset` against the test DB before each run.

### Coverage

```bash
npm run test:coverage
```

## Key Routes

| Route | Description |
|-------|-------------|
| `GET /` | Landing page |
| `GET /auth/signup` | Register a new account |
| `GET /auth/signin` | Sign in |
| `GET /dashboard` | Your proposals and agreed swaps |
| `GET /profile/me` | Edit your canTeach / wantToLearn skills |
| `GET /profile/:userId` | View a user's profile and send a proposal |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:integration` | Run integration tests |
| `npm run test:coverage` | Unit test coverage report |

## Deployment

The app deploys to **Vercel**. Set the environment variables listed above in the Vercel project settings. The `DATABASE_URL` should point to a production Postgres instance (Supabase or Neon recommended).

```bash
# Verify production build locally before deploying
npm run build
```
