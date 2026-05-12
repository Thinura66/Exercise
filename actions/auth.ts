'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export type ActionState = { success: false; error: string } | null

const BCRYPT_ROUNDS = 12

export async function createUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const email = (formData.get('email') as string | null)?.trim().toLowerCase() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  if (!name || !email || !password) {
    return { success: false, error: 'All fields are required.' }
  }

  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' }
  }

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    await prisma.user.create({ data: { name, email, passwordHash } })
  } catch (e: unknown) {
    const isUniqueViolation =
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code: string }).code === 'P2002'
    if (isUniqueViolation) {
      return { success: false, error: 'Could not create account. Please try again.' }
    }
    console.error('[createUser] unexpected error', e)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }

  redirect('/dashboard')
}
