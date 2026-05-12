import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import SignInForm from './SignInForm'

export default async function SignInPage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignInForm />
    </main>
  )
}
