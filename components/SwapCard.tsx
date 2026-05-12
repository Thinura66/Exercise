'use client'

import { useActionState } from 'react'
import { cancelSwap, type ProposalActionState } from '@/actions/proposals'

interface Props {
  proposal: {
    id: string
    offeredSkill: string
    requestedSkill: string
    proposer: { id: string; name: string; email: string }
    counterpart: { id: string; name: string; email: string }
  }
  viewerId: string
}

export default function SwapCard({ proposal, viewerId }: Props) {
  const [state, formAction, pending] = useActionState<ProposalActionState, FormData>(
    cancelSwap,
    null,
  )

  const isProposer = viewerId === proposal.proposer.id
  const myParty = isProposer ? proposal.proposer : proposal.counterpart
  const otherParty = isProposer ? proposal.counterpart : proposal.proposer

  return (
    <div className="bg-white rounded-xl shadow-md p-5 w-full">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">You teach</p>
          <p className="font-semibold">{isProposer ? proposal.offeredSkill : proposal.requestedSkill}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">They teach you</p>
          <p className="font-semibold">{isProposer ? proposal.requestedSkill : proposal.offeredSkill}</p>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        <p><span className="font-medium">Your email:</span> {myParty.email}</p>
        <p><span className="font-medium">{otherParty.name}&apos;s email:</span> {otherParty.email}</p>
      </div>

      {state?.error && (
        <p role="alert" className="text-red-600 text-sm mb-2">{state.error}</p>
      )}

      <form action={formAction}>
        <input type="hidden" name="proposalId" value={proposal.id} />
        <button
          type="submit"
          disabled={pending}
          aria-disabled={pending}
          className="text-red-600 text-sm border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
        >
          {pending ? 'Cancelling…' : 'Cancel swap'}
        </button>
      </form>
    </div>
  )
}
