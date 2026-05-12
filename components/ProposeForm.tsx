'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { createProposal, type ProposalActionState } from '@/actions/proposals'

const selectStyle = {
  background: '#0f172a',
  border: '1px solid #334155',
  color: '#f8fafc',
  outline: 'none',
}

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
      <div
        className="rounded-2xl p-6"
        style={{ background: '#1e293b', border: '1px solid #334155' }}
      >
        <h2 className="text-sm font-semibold mb-2" style={{ color: '#f8fafc' }}>Propose a Swap</h2>
        <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
          {callerCanTeach.length === 0
            ? '⚠ Add skills to your profile before proposing a swap.'
            : '⚠ This user has no skills listed yet — they need to update their profile.'}
        </p>
      </div>
    )
  }

  if (state?.success === true) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{ background: '#1e293b', border: '1px solid #334155' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />
          <h2 className="text-sm font-semibold" style={{ color: '#f8fafc' }}>Propose a Swap</h2>
        </div>
        <div
          className="rounded-xl p-6 text-center"
          style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <div className="text-2xl mb-3" style={{ color: '#22c55e' }}>✓</div>
          <p className="text-sm font-semibold mb-1" style={{ color: '#22c55e' }}>Proposal sent!</p>
          <p className="text-xs leading-relaxed mb-4" style={{ color: '#64748b' }}>
            Check your dashboard to track the response.
          </p>
          <Link
            href="/dashboard"
            className="text-xs font-semibold"
            style={{ color: '#f59e0b' }}
          >
            Go to dashboard →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: '#1e293b', border: '1px solid #334155' }}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />
        <h2 className="text-sm font-semibold" style={{ color: '#f8fafc' }}>Propose a Swap</h2>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="counterpartId" value={counterpartId} />

        <div>
          <label htmlFor="offeredSkill" className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
            I will teach
          </label>
          <select
            id="offeredSkill"
            name="offeredSkill"
            required
            className="w-full px-3 py-2.5 text-sm rounded-lg transition-all"
            style={selectStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(245,158,11,0.15)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <option value="">Select a skill…</option>
            {callerCanTeach.map((skill) => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-center">
          <div className="text-lg" style={{ color: '#334155' }}>⇅</div>
        </div>

        <div>
          <label htmlFor="requestedSkill" className="block text-xs font-medium mb-1.5" style={{ color: '#94a3b8' }}>
            They will teach me
          </label>
          <select
            id="requestedSkill"
            name="requestedSkill"
            required
            className="w-full px-3 py-2.5 text-sm rounded-lg transition-all"
            style={selectStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(34,197,94,0.15)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <option value="">Select a skill…</option>
            {targetCanTeach.map((skill) => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>

        {state?.error && (
          <div
            role="alert"
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          aria-disabled={pending}
          className="w-full py-2.5 text-sm font-semibold rounded-lg transition-all mt-1"
          style={{
            background: pending ? '#92400e' : 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#0f172a',
            opacity: pending ? 0.7 : 1,
            cursor: pending ? 'not-allowed' : 'pointer',
          }}
        >
          {pending ? 'Sending proposal…' : 'Send swap proposal →'}
        </button>
      </form>
    </div>
  )
}
