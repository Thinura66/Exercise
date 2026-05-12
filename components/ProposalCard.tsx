'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { ProposalStatus } from '@/lib/enums'
import { respondToProposal, acceptCounter, type ProposalActionState } from '@/actions/proposals'

interface Proposal {
  id: string
  offeredSkill: string
  requestedSkill: string
  status: string
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

const selectStyle = {
  background: '#0f172a',
  border: '1px solid #334155',
  color: '#f8fafc',
  outline: 'none',
  width: '100%',
  padding: '8px 12px',
  fontSize: '0.8125rem',
  borderRadius: '8px',
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

  const mySkill = isProposer ? proposal.offeredSkill : proposal.requestedSkill
  const theirSkill = isProposer ? proposal.requestedSkill : proposal.offeredSkill

  return (
    <div
      className="rounded-xl p-5 w-full"
      style={{ background: '#1e293b', border: '1px solid #334155' }}
    >
      {/* Skills row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <p className="text-xs mb-0.5" style={{ color: '#475569' }}>You offer</p>
          <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>{mySkill}</p>
        </div>
        <div className="text-sm flex-shrink-0" style={{ color: '#334155' }}>⇄</div>
        <div className="flex-1 text-right">
          <p className="text-xs mb-0.5" style={{ color: '#475569' }}>They offer</p>
          <p className="text-sm font-semibold" style={{ color: '#f8fafc' }}>{theirSkill}</p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-3"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
        >
          {error}
        </div>
      )}

      {/* ── Counterpart of PENDING ── */}
      {isCounterpart && proposal.status === ProposalStatus.PENDING && (
        <div className="flex flex-col gap-2">
          {!showCounterForm ? (
            <div className="flex gap-2 flex-wrap">
              <form action={respondAction}>
                <input type="hidden" name="proposalId" value={proposal.id} />
                <input type="hidden" name="action" value="accept" />
                <button
                  type="submit"
                  disabled={respondPending}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', opacity: respondPending ? 0.5 : 1 }}
                >
                  ✓ Accept
                </button>
              </form>
              <form action={respondAction}>
                <input type="hidden" name="proposalId" value={proposal.id} />
                <input type="hidden" name="action" value="decline" />
                <button
                  type="submit"
                  disabled={respondPending}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', opacity: respondPending ? 0.5 : 1 }}
                >
                  ✗ Decline
                </button>
              </form>
              <button
                type="button"
                onClick={() => setShowCounterForm(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                ⇄ Counter
              </button>
            </div>
          ) : (
            <form action={respondAction} className="flex flex-col gap-3 mt-1">
              <input type="hidden" name="proposalId" value={proposal.id} />
              <input type="hidden" name="action" value="counter" />
              <div
                className="rounded-lg p-3"
                style={{ background: '#0f172a', border: '1px solid #334155' }}
              >
                <p className="text-xs font-semibold mb-3" style={{ color: '#94a3b8' }}>Propose different terms</p>
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#64748b' }}>I will teach instead</label>
                    <select name="counterOfferedSkill" required style={selectStyle}>
                      <option value="">Select…</option>
                      {counterpartCanTeach.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: '#64748b' }}>I want to learn instead</label>
                    <select name="counterRequestedSkill" required style={selectStyle}>
                      <option value="">Select…</option>
                      {proposerCanTeach.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={respondPending}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0f172a', opacity: respondPending ? 0.5 : 1 }}
                >
                  Send counter →
                </button>
                <button
                  type="button"
                  onClick={() => setShowCounterForm(false)}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ color: '#64748b', border: '1px solid #334155' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Proposer of PENDING ── waiting */}
      {isProposer && proposal.status === ProposalStatus.PENDING && (
        <div className="flex items-center gap-2 text-xs" style={{ color: '#475569' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#f59e0b' }} />
          Awaiting their response…
        </div>
      )}

      {/* ── Proposer of COUNTERED ── */}
      {isProposer && proposal.status === ProposalStatus.COUNTERED && (
        <div className="flex flex-col gap-3">
          <div
            className="rounded-lg p-3"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: '#f59e0b' }}>Counter offer received</p>
            <div className="flex items-center gap-3 text-sm">
              <div>
                <p className="text-xs mb-0.5" style={{ color: '#64748b' }}>They&apos;ll teach</p>
                <p className="font-semibold" style={{ color: '#f8fafc' }}>{proposal.counterOfferedSkill}</p>
              </div>
              <span style={{ color: '#334155' }}>⇄</span>
              <div>
                <p className="text-xs mb-0.5" style={{ color: '#64748b' }}>They want to learn</p>
                <p className="font-semibold" style={{ color: '#f8fafc' }}>{proposal.counterRequestedSkill}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <form action={acceptCounterAction}>
              <input type="hidden" name="proposalId" value={proposal.id} />
              <button
                type="submit"
                disabled={acceptCounterPending}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', opacity: acceptCounterPending ? 0.5 : 1 }}
              >
                ✓ Accept counter
              </button>
            </form>
            <form action={respondAction}>
              <input type="hidden" name="proposalId" value={proposal.id} />
              <input type="hidden" name="action" value="decline" />
              <button
                type="submit"
                disabled={respondPending}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', opacity: respondPending ? 0.5 : 1 }}
              >
                ✗ Decline
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
