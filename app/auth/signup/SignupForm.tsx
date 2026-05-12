'use client'

import { useActionState } from 'react'
import { createUser, type ActionState } from '@/actions/auth'

export default function SignupForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createUser,
    null,
  )

  return (
    <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
      <h1 className="text-xl font-bold text-center mb-1">Skill Swap Board</h1>
      <p className="text-sm text-gray-500 text-center mb-6">Create your account</p>

      <form action={formAction} className="flex flex-col gap-4">
        <input
          name="name"
          type="text"
          placeholder="Full name"
          required
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          name="email"
          type="email"
          placeholder="Email address"
          required
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          name="password"
          type="password"
          placeholder="Password (min 8 characters)"
          required
          minLength={8}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {state?.error && (
          <p role="alert" className="text-red-600 text-sm -mt-1">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        Already have an account?{' '}
        <a href="/auth/signin" className="text-indigo-600 hover:underline">
          Sign in
        </a>
      </p>
    </div>
  )
}
