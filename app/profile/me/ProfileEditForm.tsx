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
