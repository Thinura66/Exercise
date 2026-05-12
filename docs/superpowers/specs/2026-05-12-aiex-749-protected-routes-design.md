# AIEX-749 — Protected Routes Design

**Date:** 2026-05-12
**Story:** As an unauthenticated user, I want to be redirected to sign in when I access a protected route so that the app enforces session boundaries
**Stack:** Next.js 16 (proxy.ts), NextAuth v5 (`auth()` from `@/auth`), TypeScript

---

## Scope

Two deliverables:
1. Replace the `proxy.ts` pass-through with a real NextAuth session check
2. Add `getAuthenticatedUserId()` helper in `lib/auth-helpers.ts` for Server Action session guards

**Out of scope:** Applying the session guard to existing Server Actions (`createUser`, `signInUser` are public endpoints — no guard needed). Future Server Actions (proposals, profile updates) will use the helper.

---

## File Structure

```
proxy.ts             ← MODIFY: add session check, redirect if unauthenticated
lib/
  auth-helpers.ts    ← NEW: getAuthenticatedUserId() helper
```

---

## proxy.ts (modified)

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

- `proxy` becomes `async` to `await auth()`
- No session → redirect to `/auth/signin` preserving the current origin
- Session present → pass through unchanged
- Matcher covers `/dashboard/:path*` and `/profile/:path*` (unchanged from AIEX-747)

---

## lib/auth-helpers.ts (new)

```ts
import { auth } from '@/auth'
import type { ActionState } from '@/actions/auth'

export async function getAuthenticatedUserId(): Promise<string | ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }
  return session.user.id
}
```

**Usage pattern in Server Actions:**

```ts
const userIdOrError = await getAuthenticatedUserId()
if (typeof userIdOrError !== 'string') return userIdOrError
const userId = userIdOrError
// ... proceed with authenticated logic using userId
```

Returns `string` (userId) on success, or `ActionState` error on missing/invalid session. TypeScript narrows the type cleanly with the `typeof` check.

---

## Error Handling

| Scenario | Handled by |
|---|---|
| Unauthenticated request to `/dashboard/*` | `proxy.ts` → redirect to `/auth/signin` |
| Unauthenticated request to `/profile/*` | `proxy.ts` → redirect to `/auth/signin` |
| Server Action called without valid session | `getAuthenticatedUserId()` → `{ success: false, error: 'Unauthorized' }` |
| Session exists but `user.id` missing | Same as above — `!session?.user?.id` guard |

---

## Manual Smoke Tests

- [ ] Unauthenticated → navigate to `/dashboard` → redirected to `/auth/signin`
- [ ] Unauthenticated → navigate to `/profile/abc` → redirected to `/auth/signin`
- [ ] Authenticated → navigate to `/dashboard` → page loads normally
- [ ] `getAuthenticatedUserId()` called with no session → returns `{ success: false, error: 'Unauthorized' }`
