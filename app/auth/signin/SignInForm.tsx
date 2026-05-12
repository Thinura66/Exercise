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
    <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
      <h1 className="text-xl font-bold text-center mb-1">Skill Swap Board</h1>
      <p className="text-sm text-gray-500 text-center mb-6">Sign in to your account</p>

      <form action={formAction} className="flex flex-col gap-4">
        <label htmlFor="email" className="sr-only">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email address"
          required
          autoComplete="email"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <label htmlFor="password" className="sr-only">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          required
          autoComplete="current-password"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {state?.error && (
          <p id="form-error" role="alert" className="text-red-600 text-sm -mt-1">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          aria-disabled={pending}
          className="bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-indigo-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
