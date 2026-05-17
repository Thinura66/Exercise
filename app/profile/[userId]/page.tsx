import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import AppHeader from '@/components/AppHeader'
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
          select: { name: true, canTeach: true },
        })
      : null,
  ])

  if (!targetUser) notFound()

  const isOwnProfile = session?.user?.id === targetUser.id

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh' }}>
      <AppHeader userName={sessionUser?.name ?? undefined} />

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs mb-6" style={{ color: '#475569' }}>
          <a href="/dashboard" style={{ color: '#64748b' }}>Dashboard</a>
          <span>›</span>
          <span style={{ color: '#94a3b8' }}>{targetUser.name}&apos;s profile</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* Profile card */}
          <ProfileCard
            name={targetUser.name}
            canTeach={targetUser.canTeach}
            wantToLearn={targetUser.wantToLearn}
          />

          {/* Propose form or own-profile notice */}
          {isOwnProfile ? (
            <div
              className="rounded-2xl p-5"
              style={{ background: '#1e293b', border: '1px solid #334155' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#475569' }}>
                This is you
              </p>
              <p className="text-sm" style={{ color: '#64748b' }}>
                Want to update your skills?
              </p>
              <Link
                href="/profile/me"
                className="inline-block mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                Edit your profile →
              </Link>
            </div>
          ) : (
            <ProposeForm
              counterpartId={targetUser.id}
              callerCanTeach={sessionUser?.canTeach ?? []}
              targetCanTeach={targetUser.canTeach}
            />
          )}
        </div>
      </main>
    </div>
  )
}
