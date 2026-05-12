# AIEX-750 + AIEX-751 — Skill Profile Management Design

**Date:** 2026-05-12
**Stories:**
- AIEX-750 (Simple): View any user's profile — ProfileCard + ProposeForm stub
- AIEX-751 (Medium): Edit own profile — TagEditor + updateProfile Server Action
**Stack:** Next.js 16, React 19, Prisma 7 (pg adapter), NextAuth v5, Tailwind CSS

---

## Scope

**AIEX-750:** Read-only profile view at `/profile/[userId]`. Fetches user by ID, renders ProfileCard with name + skill tags. Shows a ProposeForm stub beneath the card if viewer is not the owner. Returns 404 for unknown users.

**AIEX-751:** Edit-own-profile page at `/profile/me`. Fetches session user's current tags. Renders two TagEditor instances (canTeach, wantToLearn) inside a form backed by `useActionState`. `updateProfile` Server Action replaces both arrays atomically.

**Out of scope:** ProposeForm with real dropdowns (AIEX-752), proposal submission logic.

---

## File Structure

```
actions/
  profile.ts                       ← NEW: updateProfile Server Action
app/
  profile/
    [userId]/
      page.tsx                     ← NEW: view profile (server component)
    me/
      page.tsx                     ← NEW: edit own profile (server component)
      ProfileEditForm.tsx          ← NEW: 'use client' — TagEditor + submit
components/
  ProfileCard.tsx                  ← NEW: name + skill tag display
  TagEditor.tsx                    ← NEW: 'use client' — add/remove tags
  ProposeFormStub.tsx              ← NEW: placeholder for AIEX-752
```

---

## ProfileCard — `components/ProfileCard.tsx`

Server component (no state). Accepts `name`, `canTeach`, `wantToLearn` as props. Renders a white card with the user's name and two badge rows. Empty lists show a subtle placeholder.

```tsx
interface Props {
  name: string
  canTeach: string[]
  wantToLearn: string[]
}
```

---

## ProposeFormStub — `components/ProposeFormStub.tsx`

Placeholder until AIEX-752. Renders a card section with title "Propose a swap" and a disabled button labelled "Propose swap (coming soon)". Will be replaced in AIEX-752.

---

## View Profile Page — `app/profile/[userId]/page.tsx`

Server component. Flow:
1. Calls `auth()` — session already guaranteed by proxy.ts but we need `session.user.id` to check ownership.
2. `prisma.user.findUnique({ where: { id: params.userId }, select: { id, name, canTeach, wantToLearn } })`
3. If not found → `notFound()` (Next.js 404)
4. Renders `<ProfileCard>` with the user data.
5. If `session.user.id !== params.userId` → also renders `<ProposeFormStub />`

---

## TagEditor — `components/TagEditor.tsx`

`'use client'` component. Props: `name` (for the hidden input), `initialTags: string[]`, `label: string`.

- Local `useState<string[]>` initialised from `initialTags`
- Text input + "Add" button → trims input, skips empty/duplicate, appends to array
- Enter key on the input also triggers add
- Each tag renders as a badge with an × remove button
- Hidden `<input type="hidden" name={name} value={JSON.stringify(tags)} />` so `formData.get(name)` carries the full array as JSON

---

## Edit Profile Page — `app/profile/me/page.tsx`

Server component:
1. `getAuthenticatedUserId()` — redirect to /auth/signin if unauthenticated (extra safety over proxy)
2. `prisma.user.findUnique({ where: { id: userId }, select: { name, canTeach, wantToLearn } })`
3. Renders heading + `<ProfileEditForm>` passing current tags as props

---

## ProfileEditForm — `app/profile/me/ProfileEditForm.tsx`

`'use client'` component. Uses `useActionState<ProfileActionState, FormData>(updateProfile, null)`.

Contains two `<TagEditor>` instances (name=`"canTeach"`, name=`"wantToLearn"`), an inline error/success message, and a submit button with pending state.

```ts
export type ProfileActionState =
  | { success: true }
  | { success: false; error: string }
  | null
```

---

## updateProfile Server Action — `actions/profile.ts`

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

  const canTeach: string[] = JSON.parse(formData.get('canTeach') as string ?? '[]')
  const wantToLearn: string[] = JSON.parse(formData.get('wantToLearn') as string ?? '[]')

  if (canTeach.length === 0 || wantToLearn.length === 0) {
    return { success: false, error: 'At least one skill required per list.' }
  }

  await prisma.user.update({
    where: { id: userIdOrError },
    data: { canTeach, wantToLearn },
  })

  revalidatePath('/profile/me')
  return { success: true }
}
```

---

## Error Handling

| Scenario | How handled |
|---|---|
| Unknown userId in `/profile/[userId]` | `notFound()` → Next.js 404 |
| Empty canTeach or wantToLearn | Server Action returns `{ success: false, error: '...' }` |
| Unauthenticated access | proxy.ts redirects before page renders |
| `getAuthenticatedUserId()` returns error | Returned directly as `ProfileActionState` |

---

## Manual Smoke Tests

**AIEX-750:**
- [ ] Navigate to `/profile/<valid-id>` → ProfileCard shows name + both tag lists
- [ ] Navigate to own profile → ProposeFormStub not shown
- [ ] Navigate to another user's profile → ProposeFormStub is shown
- [ ] Navigate to `/profile/nonexistent-id` → 404 page

**AIEX-751:**
- [ ] Navigate to `/profile/me` → current canTeach and wantToLearn pre-populated
- [ ] Add a tag to canTeach, submit → persisted on reload
- [ ] Remove all tags from one list, submit → inline error
- [ ] Submit with valid tags → success message shown
