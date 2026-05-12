import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-helpers'
import ProfileCard from '@/components/ProfileCard'
import ProfileEditForm from './ProfileEditForm'

export default async function ProfileMePage() {
  const userIdOrError = await getAuthenticatedUserId()
  if (typeof userIdOrError !== 'string') redirect('/auth/signin')

  const user = await prisma.user.findUnique({
    where: { id: userIdOrError },
    select: { name: true, canTeach: true, wantToLearn: true },
  })

  if (!user) redirect('/auth/signin')

  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-16 bg-gray-50 px-4 gap-6">
      <h1 className="text-2xl font-bold self-start max-w-md w-full">Your Profile</h1>
      <ProfileCard
        name={user.name}
        canTeach={user.canTeach}
        wantToLearn={user.wantToLearn}
      />
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Edit Skills</h2>
        <ProfileEditForm
          initialCanTeach={user.canTeach}
          initialWantToLearn={user.wantToLearn}
        />
      </div>
    </main>
  )
}
