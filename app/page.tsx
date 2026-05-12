import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50">
      <h1 className="text-3xl font-bold">Skill Swap Board</h1>
      <p className="text-gray-500">Teach what you know. Learn what you don&apos;t.</p>
      <div className="flex gap-4">
        <Link
          href="/auth/signup"
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          Create account
        </Link>
        <Link
          href="/auth/signin"
          className="border px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-100"
        >
          Sign in
        </Link>
      </div>
    </main>
  )
}
