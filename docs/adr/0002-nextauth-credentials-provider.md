# ADR-0002: NextAuth v5 with Credentials Provider

**Date:** 2026-05-12
**Status:** Accepted

## Context

The app requires email/password authentication for internal employees. Options considered:
- Custom JWT implementation
- NextAuth v5 with credentials provider
- NextAuth v5 with OAuth (Google, GitHub)
- Clerk / Auth0

OAuth providers were out of scope (no external accounts). A custom JWT implementation would require building session management, token refresh, and middleware from scratch.

## Decision

Use **NextAuth v5 with credentials provider** and JWT session strategy.

- Configured in `auth.ts` at the project root
- Route handler at `app/api/auth/[...nextauth]/route.ts`
- Passwords hashed with `bcryptjs` (12 rounds) before storage
- User `id` attached to the JWT token via `jwt` callback and exposed on `session.user.id`

## Consequences

**Positive:**
- Minimal boilerplate — NextAuth handles session cookies, CSRF, and route protection hooks
- JWT strategy avoids DB round-trips on every request
- Easy to extend with OAuth providers later if needed

**Negative:**
- Credentials provider offers no built-in password reset or email verification flow — these must be built manually if required
- NextAuth v5 has breaking changes from v4; do not rely on v4 documentation
