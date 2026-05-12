import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import ProfileCard from '@/components/ProfileCard'
import ProposeForm from '@/components/ProposeForm'

interface Props {
  params: Promise<{ userId: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params
  const session = await auth()

  const [targetUser, sessionUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, canTeach: true, wantToLearn: true },
    }),
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { canTeach: true },
        })
      : null,
  ])

  if (!targetUser) notFound()

  const isOwnProfile = session?.user?.id === targetUser.id

  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-16 bg-gray-50 px-4">
      <ProfileCard
        name={targetUser.name}
        canTeach={targetUser.canTeach}
        wantToLearn={targetUser.wantToLearn}
      />
      {!isOwnProfile && (
        <ProposeForm
          counterpartId={targetUser.id}
          callerCanTeach={sessionUser?.canTeach ?? []}
          targetCanTeach={targetUser.canTeach}
        />
      )}
    </main>
  )
}
