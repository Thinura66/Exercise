# AIEX-750 + AIEX-751 — Skill Profile Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build profile view (`/profile/[userId]`) and profile edit (`/profile/me`) pages with ProfileCard, TagEditor, ProposeFormStub components and `updateProfile` Server Action.

**Architecture:** Server components fetch data via Prisma and pass it to client components. TagEditor uses `useState` + a hidden JSON input so the tag array travels through standard `FormData`. `updateProfile` uses `getAuthenticatedUserId()` from `lib/auth-helpers.ts` (AIEX-749) and replaces both skill arrays atomically.

**Tech Stack:** Next.js 16, React 19, Prisma 7, NextAuth v5, Tailwind CSS, TypeScript strict

---

### Task 1: ProfileCard Component

**Files:**
- Create: `components/ProfileCard.tsx`

- [ ] **Step 1: Create `components/ProfileCard.tsx`**

```tsx
interface Props {
  name: string
  canTeach: string[]
  wantToLearn: string[]
}

export default function ProfileCard({ name, canTeach, wantToLearn }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md">
      <h1 className="text-2xl font-bold mb-4">{name}</h1>

      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Can Teach
        </h2>
        {canTeach.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {canTeach.map((skill) => (
              <span
                key={skill}
                className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No skills listed yet</p>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Wants to Learn
        </h2>
        {wantToLearn.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {wantToLearn.map((skill) => (
              <span
                key={skill}
                className="bg-emerald-100 text-emerald-800 text-sm px-3 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No skills listed yet</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/ProfileCard.tsx
git commit -m "feat(AIEX-750): add ProfileCard component"
```

---

### Task 2: ProposeFormStub Component

**Files:**
- Create: `components/ProposeFormStub.tsx`

- [ ] **Step 1: Create `components/ProposeFormStub.tsx`**

```tsx
export default function ProposeFormStub() {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md mt-4">
      <h2 className="text-lg font-semibold mb-3">Propose a Swap</h2>
      <p className="text-sm text-gray-500 mb-4">
        Skill swap proposals will be available soon.
      </p>
      <button
        type="button"
        disabled
        className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium opacity-50 cursor-not-allowed"
      >
        Propose swap (coming soon)
      </button>
    </div>
  )
}
```

This is a placeholder replaced in AIEX-752 when the proposal flow is implemented.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/ProposeFormStub.tsx
git commit -m "feat(AIEX-750): add ProposeFormStub placeholder"
```

---

### Task 3: View Profile Page

**Files:**
- Create: `app/profile/[userId]/page.tsx`

- [ ] **Step 1: Create `app/profile/[userId]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import ProfileCard from '@/components/ProfileCard'
import ProposeFormStub from '@/components/ProposeFormStub'

interface Props {
  params: Promise<{ userId: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params
  const session = await auth()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, canTeach: true, wantToLearn: true },
  })

  if (!user) notFound()

  const isOwnProfile = session?.user?.id === user.id

  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-16 bg-gray-50 px-4">
      <ProfileCard
        name={user.name}
        canTeach={user.canTeach}
        wantToLearn={user.wantToLearn}
      />
      {!isOwnProfile && <ProposeFormStub />}
    </main>
  )
}
```

Note: `params` is a `Promise` in Next.js 16 dynamic routes — must be `await`ed.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add "app/profile/[userId]/page.tsx"
git commit -m "feat(AIEX-750): add profile view page with ProfileCard and ProposeFormStub"
```

---

### Task 4: TagEditor Component

**Files:**
- Create: `components/TagEditor.tsx`

- [ ] **Step 1: Create `components/TagEditor.tsx`**

```tsx
'use client'

import { useState, useRef } from 'react'

interface Props {
  name: string
  label: string
  initialTags: string[]
}

export default function TagEditor({ name, label, initialTags }: Props) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const inputRef = useRef<HTMLInputElement>(null)

  function addTag() {
    const value = inputRef.current?.value.trim() ?? ''
    if (!value || tags.includes(value)) return
    setTags((prev) => [...prev, value])
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>

      <div className="flex flex-wrap gap-2 mb-3 min-h-[2rem]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              className="text-indigo-500 hover:text-indigo-700 leading-none"
            >
              ×
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-sm text-gray-400 italic">No tags yet</span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder={`Add a ${label.toLowerCase()} skill…`}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
          className="border rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={addTag}
          className="bg-indigo-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-indigo-700"
        >
          Add
        </button>
      </div>

      {/* Hidden input carries the full array through FormData */}
      <input type="hidden" name={name} value={JSON.stringify(tags)} />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/TagEditor.tsx
git commit -m "feat(AIEX-751): add TagEditor component"
```

---

### Task 5: updateProfile Server Action

**Files:**
- Create: `actions/profile.ts`

- [ ] **Step 1: Create `actions/profile.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-helpers'

export type ProfileActionState =
  | { success: true }
  | { success: false; error: string }
  | null

export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const userIdOrError = await getAuthenticatedUserId()
  if (typeof userIdOrError !== 'string') return userIdOrError

  let canTeach: string[]
  let wantToLearn: string[]

  try {
    canTeach = JSON.parse(formData.get('canTeach') as string ?? '[]')
    wantToLearn = JSON.parse(formData.get('wantToLearn') as string ?? '[]')
  } catch {
    return { success: false, error: 'Invalid form data.' }
  }

  if (!Array.isArray(canTeach) || canTeach.length === 0 ||
      !Array.isArray(wantToLearn) || wantToLearn.length === 0) {
    return { success: false, error: 'At least one skill required per list.' }
  }

  try {
    await prisma.user.update({
      where: { id: userIdOrError },
      data: { canTeach, wantToLearn },
    })
  } catch (e) {
    console.error('[updateProfile] unexpected error', e)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }

  revalidatePath('/profile/me')
  return { success: true }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add actions/profile.ts
git commit -m "feat(AIEX-751): add updateProfile Server Action"
```

---

### Task 6: ProfileEditForm Component

**Files:**
- Create: `app/profile/me/ProfileEditForm.tsx`

- [ ] **Step 1: Create `app/profile/me/ProfileEditForm.tsx`**

```tsx
'use client'

import { useActionState } from 'react'
import { updateProfile, type ProfileActionState } from '@/actions/profile'
import TagEditor from '@/components/TagEditor'

interface Props {
  initialCanTeach: string[]
  initialWantToLearn: string[]
}

export default function ProfileEditForm({ initialCanTeach, initialWantToLearn }: Props) {
  const [state, formAction, pending] = useActionState<ProfileActionState, FormData>(
    updateProfile,
    null,
  )

  return (
    <form action={formAction} className="flex flex-col gap-6 w-full max-w-md">
      <TagEditor
        name="canTeach"
        label="Can Teach"
        initialTags={initialCanTeach}
      />
      <TagEditor
        name="wantToLearn"
        label="Wants to Learn"
        initialTags={initialWantToLearn}
      />

      {state?.success === false && (
        <p role="alert" className="text-red-600 text-sm">
          {state.error}
        </p>
      )}
      {state?.success === true && (
        <p role="status" className="text-emerald-600 text-sm font-medium">
          Profile updated successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        aria-disabled={pending}
        className="bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add app/profile/me/ProfileEditForm.tsx
git commit -m "feat(AIEX-751): add ProfileEditForm with TagEditor instances"
```

---

### Task 7: Edit Profile Page

**Files:**
- Create: `app/profile/me/page.tsx`

- [ ] **Step 1: Create `app/profile/me/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-helpers'
import ProfileCard from '@/components/ProfileCard'
import ProfileEditForm from './ProfileEditForm'

export default async function ProfileMePage() {
  const userIdOrError = await getAuthenticatedUserId()
  if (typeof userIdOrError !== 'string') redirect('/auth/signin')

  const user = await prisma.user.findUnique({
    where: { id: userIdOrError },
    select: { name: true, canTeach: true, wantToLearn: true },
  })

  if (!user) redirect('/auth/signin')

  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-16 bg-gray-50 px-4 gap-6">
      <h1 className="text-2xl font-bold self-start max-w-md w-full">Your Profile</h1>
      <ProfileCard
        name={user.name}
        canTeach={user.canTeach}
        wantToLearn={user.wantToLearn}
      />
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Edit Skills</h2>
        <ProfileEditForm
          initialCanTeach={user.canTeach}
          initialWantToLearn={user.wantToLearn}
        />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Verify pages render**

```bash
npm run dev
```

- Open `http://localhost:3000/profile/me` → should show profile card + edit form with your current skills
- Open `http://localhost:3000/profile/<your-user-id>` → should show ProfileCard + ProposeFormStub
- Open `http://localhost:3000/profile/nonexistent` → should show 404

Stop with `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add app/profile/me/page.tsx
git commit -m "feat(AIEX-751): add edit profile page"
```

---

### Task 8: Manual Smoke Tests

Start the dev server: `npm run dev`. Sign in first at `/auth/signin`.

**AIEX-750 tests:**

- [ ] **Test 1** — Navigate to `/profile/<your-user-id>` → ProfileCard shows your name + both skill lists. ProposeFormStub NOT shown (own profile).

- [ ] **Test 2** — Find another user's ID in the DB (`npx prisma studio` → User table). Navigate to `/profile/<other-id>` → ProfileCard shows their skills. ProposeFormStub IS shown.

- [ ] **Test 3** — Navigate to `/profile/nonexistent-id-12345` → Next.js 404 page.

**AIEX-751 tests:**

- [ ] **Test 4** — Navigate to `/profile/me` → form shows current canTeach and wantToLearn tags.

- [ ] **Test 5** — Add a new tag (e.g. "TypeScript") to canTeach. Click "Save profile" → success message shown. Reload → tag persists.

- [ ] **Test 6** — Remove all tags from canTeach by clicking × on each. Click "Save profile" → inline error "At least one skill required per list."

- [ ] **Test 7** — Sign out (clear session cookie or close incognito). Navigate to `/profile/me` → redirected to `/auth/signin`.

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat(AIEX-750,AIEX-751): skill profile management complete — all smoke tests pass"
```
