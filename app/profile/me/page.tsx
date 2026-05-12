import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-helpers'
import AppHeader from '@/components/AppHeader'
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
    <div style={{ background: '#0f172a', minHeight: '100vh' }}>
      <AppHeader userName={user.name} />

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: '#f8fafc', fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Your Profile
          </h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Manage your skills to get the right swap proposals.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Current profile preview */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>
              Current profile
            </p>
            <ProfileCard
              name={user.name}
              canTeach={user.canTeach}
              wantToLearn={user.wantToLearn}
            />
          </div>

          {/* Edit form */}
          <div
            className="rounded-2xl p-6"
            style={{ background: '#1e293b', border: '1px solid #334155' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: '#475569' }}>
              Edit skills
            </p>
            <ProfileEditForm
              initialCanTeach={user.canTeach}
              initialWantToLearn={user.wantToLearn}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
