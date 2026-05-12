'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signInUser, type ActionState } from '@/actions/auth'

export default function SignInForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    signInUser,
    null,
  )

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="block text-xs font-medium mb-1.5 tracking-wide" style={{ color: '#94a3b8' }}>
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          required
          autoComplete="email"
          className="w-full px-4 py-2.5 text-sm rounded-lg transition-all duration-150"
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            color: '#f8fafc',
            outline: 'none',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(245,158,11,0.15)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.boxShadow = 'none' }}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-medium mb-1.5 tracking-wide" style={{ color: '#94a3b8' }}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          className="w-full px-4 py-2.5 text-sm rounded-lg transition-all duration-150"
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            color: '#f8fafc',
            outline: 'none',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(245,158,11,0.15)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.boxShadow = 'none' }}
        />
      </div>

      {state?.error && (
        <div
          id="form-error"
          role="alert"
          className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-lg"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        aria-disabled={pending}
        className="w-full py-2.5 text-sm font-semibold rounded-lg transition-all duration-150 mt-1"
        style={{
          background: pending ? '#92400e' : 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#0f172a',
          opacity: pending ? 0.7 : 1,
          cursor: pending ? 'not-allowed' : 'pointer',
          letterSpacing: '0.01em',
        }}
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Signing in…
          </span>
        ) : (
          'Sign in →'
        )}
      </button>

      <p className="text-center text-xs mt-1" style={{ color: '#475569' }}>
        No account?{' '}
        <Link
          href="/auth/signup"
          className="font-medium transition-colors"
          style={{ color: '#f59e0b' }}
        >
          Create one
        </Link>
      </p>
    </form>
  )
}
