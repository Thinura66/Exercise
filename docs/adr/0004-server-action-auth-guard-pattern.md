# ADR-0004: Server Action Auth Guard Pattern

**Date:** 2026-05-12
**Status:** Accepted

## Context

Every authenticated Server Action needs to verify the caller has a valid session before touching the database. Middleware redirects are a UX convenience only — they can be bypassed by direct HTTP calls or curl.

## Decision

Every authenticated Server Action calls **`getAuthenticatedUserId()`** from `lib/auth-helpers.ts` as its **first statement**, before any database access.

```ts
export async function myAction(_prev: ActionState, formData: FormData) {
  const userIdOrError = await getAuthenticatedUserId()
  if (typeof userIdOrError !== 'string') return userIdOrError
  const userId = userIdOrError
  // DB access starts here
}
```

- Returns the caller's `userId` string on success
- Returns `{ success: false, error: 'Unauthorized' }` on missing or expired session
- The calling action returns this error immediately — zero DB calls before the guard passes

**Public actions exempt** (pre-authentication): `createUser`, `signInUser` in `actions/auth.ts`.

## Consequences

**Positive:**
- Session validation is impossible to skip — no DB call can precede the guard
- Centralised in one helper; changing auth logic requires one file edit
- Uniform `ActionState` return type means the UI handles auth errors the same as business logic errors

**Negative:**
- Every new Server Action must remember to call the guard first — forgetting it creates a security hole
- Integration tests must mock `getAuthenticatedUserId` to simulate authenticated vs unauthenticated callers
