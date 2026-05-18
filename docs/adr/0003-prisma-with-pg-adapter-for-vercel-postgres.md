# ADR-0003: Prisma 7 with PrismaPg Driver Adapter

**Date:** 2026-05-12
**Status:** Accepted

## Context

The app runs on Vercel with a Vercel Postgres (Neon-backed) database. Prisma's default query engine uses persistent TCP connections, which are incompatible with serverless environments that have connection limits and short-lived function instances.

## Decision

Use **Prisma 7 with `@prisma/adapter-pg`** (PrismaPg driver adapter) instead of the default Prisma engine.

```ts
// lib/prisma.ts
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({ adapter })
```

A global singleton pattern prevents connection pool exhaustion during hot-reloads in development.

## Consequences

**Positive:**
- Compatible with Vercel Postgres and other serverless Postgres providers
- Connection pooling handled by `pg.Pool` — safe under concurrent serverless invocations
- Singleton pattern reuses the client across hot-reloads in `next dev`

**Negative:**
- Not the default Prisma setup — `prisma generate` must run before `next build` (configured in `package.json` build script and Vercel build command)
- `@prisma/adapter-pg` is required as an explicit dependency; omitting it causes a runtime error
