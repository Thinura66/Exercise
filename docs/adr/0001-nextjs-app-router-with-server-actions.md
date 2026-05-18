# ADR-0001: Next.js App Router with Server Actions

**Date:** 2026-05-12
**Status:** Accepted

## Context

We needed a full-stack React framework for the Skill Swap Board. Options considered:
- Next.js Pages Router + API routes
- Next.js App Router + Server Actions
- Remix
- SvelteKit

The app has a small number of forms with simple mutations (propose, accept, decline, cancel) and no public API surface.

## Decision

Use **Next.js App Router with Server Actions** for all data mutations instead of dedicated API route handlers.

## Consequences

**Positive:**
- Server Actions colocate mutation logic with the UI that triggers them — no separate `POST /api/proposals` route files
- `revalidatePath('/dashboard')` gives instant cache invalidation after each mutation without client-side state management
- Server Components fetch data directly without client `useEffect` + fetch calls
- Type safety end-to-end: form data typed at the action boundary

**Negative:**
- App Router is a newer paradigm with breaking changes vs Pages Router — always check `node_modules/next/dist/docs/` before writing Next.js-specific code
- Server Actions cannot be called cross-origin, limiting future public API exposure
