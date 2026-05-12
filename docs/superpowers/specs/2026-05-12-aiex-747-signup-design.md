# AIEX-747 — User Registration Design

**Date:** 2026-05-12
**Story:** As an employee, I want to register with name, email, and password so that I can create a Skill Swap Board account
**Stack:** Next.js 15 App Router (React 19) · Prisma · PostgreSQL (Vercel Postgres) · NextAuth credentials · Tailwind CSS

> **Note:** `useActionState` requires React 19, available from Next.js 15+. Running `create-next-app@latest` installs Next.js 15 with React 19. If pinned to Next.js 14 / React 18, replace `useActionState` from `'react'` with `useFormState` from `'react-dom'` and `useFormStatus` for the pending state.

---

## Scope

This story covers:
1. Initial Next.js 14 project scaffold (this is the first story in the repo)
2. Prisma client singleton and User model schema
3. The `/auth/signup` page and `createUser` Server Action

**Out of scope:** NextAuth session wiring (AIEX-748), middleware (AIEX-749), DB migration (AIEX-789), dashboard page (covered by Dashboard epic).

---

## Project Scaffold

Run once to initialise the repo:

```bash
npx create-next-app@latest . \
  --typescript --app --tailwind --eslint \
  --src-dir=false --import-alias="@/*"
```

Install additional dependencies:

```bash
npm install next-auth prisma @prisma/client bcryptjs
npm install -D @types/bcryptjs
npx prisma init
```

Add to `.env.local`:

```
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

---

## File Structure

```
app/
  auth/
    signup/
      page.tsx          # server component — renders SignupForm
      SignupForm.tsx     # 'use client' — useActionState wiring
  dashboard/
    page.tsx            # redirect target after signup (stub)
actions/
  auth.ts               # createUser Server Action
lib/
  prisma.ts             # PrismaClient singleton
middleware.ts           # protect /dashboard and /profile/* (stub for now)
prisma/
  schema.prisma         # User model
```

---

## Prisma Schema (User model)

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  canTeach     String[]
  wantToLearn  String[]
  createdAt    DateTime @default(now())
}
```

The full Proposal model and ProposalStatus enum are added in AIEX-789.

---

## PrismaClient Singleton — `lib/prisma.ts`

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## Server Action — `actions/auth.ts`

```ts
'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

type ActionState = { success: false; error: string } | null

export async function createUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: 'Email already in use' }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({ data: { name, email, passwordHash } })

  redirect('/dashboard')
}
```

`redirect()` throws `NEXT_REDIRECT` internally — it must not be wrapped in try/catch.

---

## Page — `app/auth/signup/page.tsx`

```tsx
import SignupForm from './SignupForm'

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignupForm />
    </main>
  )
}
```

---

## Client Component — `app/auth/signup/SignupForm.tsx`

```tsx
'use client'

import { useActionState } from 'react'
import { createUser } from '@/actions/auth'

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(createUser, null)

  return (
    <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
      <h1 className="text-xl font-bold text-center mb-1">Skill Swap Board</h1>
      <p className="text-sm text-gray-500 text-center mb-6">Create your account</p>

      <form action={formAction} className="flex flex-col gap-4">
        <input
          name="name"
          type="text"
          placeholder="Full name"
          required
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <input
          name="email"
          type="email"
          placeholder="Email address"
          required
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <input
          name="password"
          type="password"
          placeholder="Password (min 8 characters)"
          required
          minLength={8}
          className="border rounded-lg px-3 py-2 text-sm"
        />

        {state?.error && (
          <p role="alert" className="text-red-600 text-sm">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium
                     hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        Already have an account?{' '}
        <a href="/auth/signin" className="text-indigo-600 hover:underline">
          Sign in
        </a>
      </p>
    </div>
  )
}
```

---

## Error Handling

| Scenario | How handled |
|---|---|
| Duplicate email | Server Action returns `{ success: false, error: "Email already in use" }` — rendered inline via `state.error` |
| Empty required field | HTML5 `required` blocks submission before Server Action fires |
| Password < 8 chars | HTML5 `minlength="8"` blocks submission |
| Unexpected DB error | Bubbles up to Next.js error boundary |
| Double submit | `disabled={pending}` prevents re-submission while action is in flight |

---

## Manual Smoke Tests

- [ ] Submit valid unique credentials → user created in DB, redirected to `/dashboard`
- [ ] Submit duplicate email → inline error "Email already in use", no new DB row
- [ ] Submit with empty name → browser blocks (HTML5 `required`)
- [ ] Submit with 7-char password → browser blocks (`minlength="8"`)
- [ ] Click submit twice quickly → button disabled on first click, no duplicate record

---

## Not In This Story

- NextAuth credentials provider and session (AIEX-748)
- Sign-in page (AIEX-748)
- Middleware auth redirect (AIEX-749)
- Full Prisma migration with Proposal model (AIEX-789)
- Dashboard page implementation (Dashboard epic)
