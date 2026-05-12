import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import ProfileCard from '@/components/ProfileCard'
import ProposeFormStub from '@/components/ProposeFormStub'

interface Props {
  params: Promise<{ userId: string }>
}

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params
  const session = await auth()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, canTeach: true, wantToLearn: true },
  })

  if (!user) notFound()

  const isOwnProfile = session?.user?.id === user.id

  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-16 bg-gray-50 px-4">
      <ProfileCard
        name={user.name}
        canTeach={user.canTeach}
        wantToLearn={user.wantToLearn}
      />
      {!isOwnProfile && <ProposeFormStub />}
    </main>
  )
}
