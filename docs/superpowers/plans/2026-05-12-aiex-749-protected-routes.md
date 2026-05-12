# AIEX-749 — Protected Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce session-based access control on `/dashboard` and `/profile/*` routes and provide a reusable `getAuthenticatedUserId()` helper for Server Actions.

**Architecture:** `proxy.ts` calls NextAuth v5's `auth()` on every request matched by the existing config — unauthenticated requests are redirected to `/auth/signin`. A thin `lib/auth-helpers.ts` module exports `getAuthenticatedUserId()` which future Server Actions call at entry to get the caller's userId or an `ActionState` error to return early.

**Tech Stack:** Next.js 16 (proxy.ts), NextAuth v5 (`auth()` from `@/auth`), TypeScript strict

---

### Task 1: Update proxy.ts with session enforcement

**Files:**
- Modify: `proxy.ts`

- [ ] **Step 1: Replace proxy.ts with the session-checking version**

Overwrite the entire file:

```ts
import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
}
```

Key changes from the stub:
- `proxy` is now `async`
- `auth()` from `@/auth` (NextAuth v5) checks the JWT session cookie
- No session → redirect to `/auth/signin` using the request's origin so the URL is correct in any environment
- Session present → pass through unchanged

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add proxy.ts
git commit -m "feat(AIEX-749): enforce session check in proxy for /dashboard and /profile/*"
```

---

### Task 2: Create getAuthenticatedUserId helper

**Files:**
- Create: `lib/auth-helpers.ts`

- [ ] **Step 1: Create lib/auth-helpers.ts**

```ts
import { auth } from '@/auth'
import type { ActionState } from '@/actions/auth'

/**
 * Call at the top of any authenticated Server Action.
 * Returns the caller's userId on success, or an ActionState error to return early.
 *
 * Usage:
 *   const userIdOrError = await getAuthenticatedUserId()
 *   if (typeof userIdOrError !== 'string') return userIdOrError
 *   const userId = userIdOrError
 */
export async function getAuthenticatedUserId(): Promise<string | ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }
  return session.user.id
}
```

`ActionState` is already exported from `actions/auth.ts` as `{ success: false; error: string } | null`. The `session.user.id` field is populated by the `jwt`/`session` callbacks added in AIEX-748.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add lib/auth-helpers.ts
git commit -m "feat(AIEX-749): add getAuthenticatedUserId helper for Server Action auth guards"
```

---

### Task 3: Manual Smoke Tests

Start the dev server: `npm run dev`

- [ ] **Smoke test 1 — Unauthenticated → /dashboard**

  Open a private/incognito window (no session cookie). Navigate to `http://localhost:3000/dashboard`.

  Expected: immediately redirected to `http://localhost:3000/auth/signin`.

- [ ] **Smoke test 2 — Unauthenticated → /profile/abc**

  In the same incognito window, navigate to `http://localhost:3000/profile/abc`.

  Expected: immediately redirected to `http://localhost:3000/auth/signin`.

- [ ] **Smoke test 3 — Authenticated → /dashboard passes through**

  Sign in via `/auth/signin`. Then navigate to `http://localhost:3000/dashboard`.

  Expected: `/dashboard` loads normally (shows the "Dashboard" stub heading from AIEX-747). No redirect.

- [ ] **Smoke test 4 — getAuthenticatedUserId with no session**

  Add a temporary `console.log` call to a Server Action (e.g. at the top of `createUser` in `actions/auth.ts`), call `getAuthenticatedUserId()` without a session (e.g. sign out first, then submit the signup form which calls `createUser`).

  Note: `createUser` is a public endpoint and intentionally has no auth guard — this test is conceptual. The helper can be verified by creating a minimal test Server Action or confirming the return type via TypeScript alone. TypeScript verification is sufficient for this story — integration testing of the helper belongs in AIEX-761.

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat(AIEX-749): protected routes complete — all smoke tests pass"
```
