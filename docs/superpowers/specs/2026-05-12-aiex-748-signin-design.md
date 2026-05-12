# AIEX-748 — Sign-In Design

**Date:** 2026-05-12
**Story:** As an employee, I want to sign in with my email and password so that I can access the Skill Swap Board
**Stack:** Next.js 16, React 19, NextAuth v5 beta, Prisma 7 (pg adapter), bcryptjs, JWT sessions

---

## Scope

This story wires up NextAuth v5 with a credentials provider and JWT sessions, and builds the `/auth/signin` page.

**Out of scope:** Sign-out (later story), `proxy.ts` auth enforcement (AIEX-749), profile/session use in other pages.

---

## File Structure

```
auth.ts                               ← NEW: NextAuth v5 config
app/
  api/auth/[...nextauth]/
    route.ts                          ← NEW: re-exports { GET, POST } handlers
  auth/
    signin/
      page.tsx                        ← NEW: server component, session guard
      SignInForm.tsx                  ← NEW: 'use client', useActionState
actions/
  auth.ts                             ← MODIFY: add signInUser Server Action
```

---

## Data Flow

1. `page.tsx` calls `auth()` → if session exists → `redirect('/dashboard')`
2. Otherwise renders `<SignInForm />`
3. Form submits → `signInUser` Server Action → `signIn('credentials', { redirectTo: '/dashboard' })`
4. NextAuth `authorize()` in `auth.ts` → Prisma lookup by email → bcrypt compare
5. Success → NextAuth throws `NEXT_REDIRECT` → user lands on `/dashboard`
6. Failure → `AuthError` caught → `{ success: false, error: 'Invalid email or password.' }` → inline error

---

## NextAuth Config — `auth.ts`

```ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize({ email, password }) {
        if (!email || !password) return null
        const user = await prisma.user.findUnique({
          where: { email: String(email).toLowerCase().trim() },
        })
        if (!user) return null
        const valid = await bcrypt.compare(String(password), user.passwordHash)
        if (!valid) return null
        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
})
```

`authorize` returns `null` for both "user not found" and "wrong password" — same response deliberately to avoid email enumeration. JWT contains `{ id, email, name }`.

---

## API Route — `app/api/auth/[...nextauth]/route.ts`

```ts
import { handlers } from '@/auth'
export const { GET, POST } = handlers
```

---

## Server Action — `signInUser` (added to `actions/auth.ts`)

```ts
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export async function signInUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = (formData.get('email') as string | null)?.trim().toLowerCase() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  if (!email || !password) {
    return { success: false, error: 'All fields are required.' }
  }

  try {
    await signIn('credentials', { email, password, redirectTo: '/dashboard' })
  } catch (e) {
    if (e instanceof AuthError) {
      return { success: false, error: 'Invalid email or password.' }
    }
    throw e // re-throw NEXT_REDIRECT so redirect propagates
  }

  return null
}
```

---

## Sign-In Page — `app/auth/signin/page.tsx`

```tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import SignInForm from './SignInForm'

export default async function SignInPage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignInForm />
    </main>
  )
}
```

---

## Sign-In Form — `app/auth/signin/SignInForm.tsx`

Centered card matching the signup form layout:

- `'use client'`
- `useActionState<ActionState, FormData>(signInUser, null)` → `[state, formAction, pending]`
- Two inputs:
  - email: `type="email"`, `required`, `autoComplete="email"`, `sr-only` label
  - password: `type="password"`, `required`, `autoComplete="current-password"`, `sr-only` label
- `{state?.error && <p role="alert">...}` for inline error
- Submit button: `disabled={pending}`, `aria-disabled={pending}`, shows "Signing in…" when pending
- Footer: "Don't have an account?" → `<Link href="/auth/signup">Sign up</Link>`

---

## Error Handling

| Scenario | How handled |
|---|---|
| Wrong password or unknown email | `authorize` returns `null` → `AuthError` → generic "Invalid email or password." |
| Empty field | HTML5 `required` blocks before action fires |
| Already authenticated | `auth()` in server component → `redirect('/dashboard')` |
| Unexpected error | Re-thrown from catch block, surfaces as Next.js 500 |

No enumeration: "user not found" and "wrong password" return the same error message.

---

## Manual Smoke Tests

- [ ] Valid credentials → session cookie set, redirected to `/dashboard`
- [ ] Wrong password → inline "Invalid email or password." stays on `/auth/signin`
- [ ] Unknown email → same inline error (no enumeration)
- [ ] Empty email or password → HTML5 `required` blocks submission
- [ ] Already authenticated → navigate to `/auth/signin` → redirected to `/dashboard`
