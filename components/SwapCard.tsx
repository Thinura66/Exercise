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
  const mySkill = isProposer ? proposal.offeredSkill : proposal.requestedSkill
  const theirSkill = isProposer ? proposal.requestedSkill : proposal.offeredSkill

  return (
    <div
      className="rounded-xl p-5 w-full"
      style={{ background: '#1e293b', border: '1px solid rgba(34,197,94,0.2)' }}
    >
      {/* Status badge */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1.5"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Active swap
        </span>
        <span className="text-xs" style={{ color: '#475569' }}>with {otherParty.name}</span>
      </div>

      {/* Skills exchange */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 rounded-lg px-3 py-2.5" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <p className="text-xs mb-0.5" style={{ color: '#92400e' }}>You teach</p>
          <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>{mySkill}</p>
        </div>
        <div className="text-base flex-shrink-0" style={{ color: '#334155' }}>⇄</div>
        <div className="flex-1 rounded-lg px-3 py-2.5" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <p className="text-xs mb-0.5" style={{ color: '#166534' }}>They teach you</p>
          <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>{theirSkill}</p>
        </div>
      </div>

      {/* Contact info */}
      <div
        className="rounded-lg px-3 py-2.5 mb-4 text-xs space-y-1"
        style={{ background: '#0f172a', border: '1px solid #1e293b' }}
      >
        <div className="flex items-center justify-between">
          <span style={{ color: '#475569' }}>Your email</span>
          <span style={{ color: '#94a3b8' }}>{myParty.email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: '#475569' }}>{otherParty.name}&apos;s email</span>
          <span style={{ color: '#94a3b8' }}>{otherParty.email}</span>
        </div>
      </div>

      {state?.success === false && state.error && (
        <div
          role="alert"
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-3"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
        >
          {state.error}
        </div>
      )}

      <form action={formAction}>
        <input type="hidden" name="proposalId" value={proposal.id} />
        <button
          type="submit"
          disabled={pending}
          aria-disabled={pending}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
          style={{
            background: 'transparent',
            color: '#64748b',
            border: '1px solid #334155',
            cursor: pending ? 'not-allowed' : 'pointer',
            opacity: pending ? 0.5 : 1,
          }}
        >
          {pending ? 'Cancelling…' : 'Cancel swap'}
        </button>
      </form>
    </div>
  )
}
