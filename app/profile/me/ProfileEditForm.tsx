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
    <form action={formAction} className="flex flex-col gap-6 w-full">
      <TagEditor name="canTeach" label="Can Teach" initialTags={initialCanTeach} />
      <TagEditor name="wantToLearn" label="Wants to Learn" initialTags={initialWantToLearn} />

      {state?.success === false && (
        <div
          role="alert"
          className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-lg"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {state.error}
        </div>
      )}
      {state?.success === true && (
        <div
          role="status"
          className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-lg"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#86efac' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Profile updated successfully.
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        aria-disabled={pending}
        className="w-full py-2.5 text-sm font-semibold rounded-lg transition-all duration-150"
        style={{
          background: pending ? '#92400e' : 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#0f172a',
          opacity: pending ? 0.7 : 1,
          cursor: pending ? 'not-allowed' : 'pointer',
        }}
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Saving…
          </span>
        ) : 'Save profile →'}
      </button>
    </form>
  )
}
