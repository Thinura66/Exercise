import { auth } from '@/auth'
import type { ActionState } from '@/actions/auth'

/**
 * Call at the top of any authenticated Server Action.
 * Returns the caller's userId on success, or an ActionState error to return early.
 *
 * Usage:
 *   const userIdOrError = await getAuthenticatedUserId()
 *   if (typeof userIdOrError !== 'string') return userIdOrError
 *   const userId = userIdOrError
 */
export async function getAuthenticatedUserId(): Promise<string | ActionState> {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }
  return session.user.id
}
