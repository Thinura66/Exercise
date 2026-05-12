# Server Action Authentication Guard

All authenticated Server Actions call `getAuthenticatedUserId()` from `lib/auth-helpers.ts` as their first statement.

## Pattern

```ts
import { getAuthenticatedUserId } from '@/lib/auth-helpers'

export async function myAction(_prev: ActionState, formData: FormData) {
  const userIdOrError = await getAuthenticatedUserId()
  if (typeof userIdOrError !== 'string') return userIdOrError
  const userId = userIdOrError
  // ... business logic
}
```

## Behaviour

- Valid session → returns the caller's `userId` (string)
- No session or expired session → returns `{ success: false, error: 'Unauthorized' }`
- The caller returns this error immediately — no DB calls before the guard

## Actions Using This Pattern

- `actions/profile.ts` — `updateProfile`
- `actions/proposals.ts` — `createProposal`, `respondToProposal`, `acceptCounter`, `cancelSwap`

## Public Actions (No Guard)

- `actions/auth.ts` — `createUser`, `signInUser` (pre-authentication endpoints)
