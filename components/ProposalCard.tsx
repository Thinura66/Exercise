'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { ProposalStatus } from '@prisma/client'
import { respondToProposal, acceptCounter, type ProposalActionState } from '@/actions/proposals'

interface Proposal {
  id: string
  offeredSkill: string
  requestedSkill: string
  status: ProposalStatus
  counterOfferedSkill: string | null
  counterRequestedSkill: string | null
  proposerId: string
  counterpartId: string
}

interface Props {
  proposal: Proposal
  viewerId: string
  counterpartCanTeach?: string[]
  proposerCanTeach?: string[]
}

export default function ProposalCard({
  proposal,
  viewerId,
  counterpartCanTeach = [],
  proposerCanTeach = [],
}: Props) {
  const [showCounterForm, setShowCounterForm] = useState(false)

  const [respondState, respondAction, respondPending] = useActionState<ProposalActionState, FormData>(
    respondToProposal,
    null,
  )
  const [acceptCounterState, acceptCounterAction, acceptCounterPending] = useActionState<ProposalActionState, FormData>(
    acceptCounter,
    null,
  )

  const isProposer = viewerId === proposal.proposerId
  const isCounterpart = viewerId === proposal.counterpartId

  const error = respondState?.error ?? acceptCounterState?.error

  return (
    <div className="bg-white rounded-xl shadow-md p-5 w-full">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm text-gray-500">You offer</p>
          <p className="font-semibold">{isProposer ? proposal.offeredSkill : proposal.requestedSkill}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">They offer</p>
          <p className="font-semibold">{isProposer ? proposal.requestedSkill : proposal.offeredSkill}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-3 capitalize">Status: {proposal.status.toLowerCase()}</p>

      {error && <p role="alert" className="text-red-600 text-sm mb-3">{error}</p>}

      {/* Counterpart of a PENDING proposal */}
      {isCounterpart && proposal.status === ProposalStatus.PENDING && (
        <div className="flex flex-col gap-2">
          {!showCounterForm ? (
            <div className="flex gap-2">
              <form action={respondAction}>
                <input type="hidden" name="proposalId" value={proposal.id} />
                <input type="hidden" name="action" value="accept" />
                <button type="submit" disabled={respondPending}
                  className="bg-emerald-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                  Accept
                </button>
              </form>
              <form action={respondAction}>
                <input type="hidden" name="proposalId" value={proposal.id} />
                <input type="hidden" name="action" value="decline" />
                <button type="submit" disabled={respondPending}
                  className="bg-red-100 text-red-700 text-sm px-3 py-1.5 rounded-lg hover:bg-red-200 disabled:opacity-50">
                  Decline
                </button>
              </form>
              <button type="button" onClick={() => setShowCounterForm(true)}
                className="bg-amber-100 text-amber-700 text-sm px-3 py-1.5 rounded-lg hover:bg-amber-200">
                Counter
              </button>
            </div>
          ) : (
            <form action={respondAction} className="flex flex-col gap-2">
              <input type="hidden" name="proposalId" value={proposal.id} />
              <input type="hidden" name="action" value="counter" />
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">I will teach instead</label>
                <select name="counterOfferedSkill" required
                  className="border rounded px-2 py-1.5 text-sm w-full">
                  <option value="">Select…</option>
                  {counterpartCanTeach.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">I want to learn instead</label>
                <select name="counterRequestedSkill" required
                  className="border rounded px-2 py-1.5 text-sm w-full">
                  <option value="">Select…</option>
                  {proposerCanTeach.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={respondPending}
                  className="bg-amber-500 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-amber-600 disabled:opacity-50">
                  Send counter
                </button>
                <button type="button" onClick={() => setShowCounterForm(false)}
                  className="text-gray-500 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-100">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Proposer of a PENDING proposal — waiting */}
      {isProposer && proposal.status === ProposalStatus.PENDING && (
        <p className="text-sm text-gray-400 italic">Awaiting response…</p>
      )}

      {/* Proposer of a COUNTERED proposal */}
      {isProposer && proposal.status === ProposalStatus.COUNTERED && (
        <div className="flex flex-col gap-2">
          <div className="bg-amber-50 rounded p-3 text-sm mb-1">
            <p className="font-medium text-amber-800 mb-1">Counter offer received</p>
            <p>They will teach: <span className="font-semibold">{proposal.counterOfferedSkill}</span></p>
            <p>They want to learn: <span className="font-semibold">{proposal.counterRequestedSkill}</span></p>
          </div>
          <div className="flex gap-2">
            <form action={acceptCounterAction}>
              <input type="hidden" name="proposalId" value={proposal.id} />
              <button type="submit" disabled={acceptCounterPending}
                className="bg-emerald-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                Accept counter
              </button>
            </form>
            <form action={respondAction}>
              <input type="hidden" name="proposalId" value={proposal.id} />
              <input type="hidden" name="action" value="decline" />
              <button type="submit" disabled={respondPending}
                className="bg-red-100 text-red-700 text-sm px-3 py-1.5 rounded-lg hover:bg-red-200 disabled:opacity-50">
                Decline
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
