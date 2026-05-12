'use client'

import { useActionState } from 'react'
import { createProposal, type ProposalActionState } from '@/actions/proposals'

interface Props {
  counterpartId: string
  callerCanTeach: string[]
  targetCanTeach: string[]
}

export default function ProposeForm({ counterpartId, callerCanTeach, targetCanTeach }: Props) {
  const [state, formAction, pending] = useActionState<ProposalActionState, FormData>(
    createProposal,
    null,
  )

  if (callerCanTeach.length === 0 || targetCanTeach.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md mt-4">
        <h2 className="text-lg font-semibold mb-2">Propose a Swap</h2>
        <p className="text-sm text-gray-500">
          {callerCanTeach.length === 0
            ? 'Add skills to your profile before proposing a swap.'
            : 'This user has no skills listed yet.'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md mt-4">
      <h2 className="text-lg font-semibold mb-4">Propose a Swap</h2>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="counterpartId" value={counterpartId} />

        <div>
          <label htmlFor="offeredSkill" className="block text-sm font-medium text-gray-700 mb-1">
            I will teach
          </label>
          <select
            id="offeredSkill"
            name="offeredSkill"
            required
            className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a skill…</option>
            {callerCanTeach.map((skill) => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="requestedSkill" className="block text-sm font-medium text-gray-700 mb-1">
            They will teach me
          </label>
          <select
            id="requestedSkill"
            name="requestedSkill"
            required
            className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a skill…</option>
            {targetCanTeach.map((skill) => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>

        {state?.error && (
          <p role="alert" className="text-red-600 text-sm">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          aria-disabled={pending}
          className="bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Sending…' : 'Propose swap'}
        </button>
      </form>
    </div>
  )
}
