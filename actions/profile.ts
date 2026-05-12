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
