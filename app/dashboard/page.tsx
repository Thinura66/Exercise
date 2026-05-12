import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ProposalStatus } from '@/lib/enums'
import Link from 'next/link'
import SwapCard from '@/components/SwapCard'
import ProposalCard from '@/components/ProposalCard'
import { signOutUser } from '@/actions/auth'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const userId = session.user.id
  const userName = session.user.name ?? 'there'

  const [sessionUser, agreedProposals, sentProposals, receivedProposals, counterPendingProposals] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, canTeach: true, wantToLearn: true } }),

      prisma.proposal.findMany({
        where: {
          OR: [{ proposerId: userId }, { counterpartId: userId }],
          status: ProposalStatus.AGREED,
        },
        include: {
          proposer: { select: { id: true, name: true, email: true } },
          counterpart: { select: { id: true, name: true, email: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),

      prisma.proposal.findMany({
        where: { proposerId: userId, status: ProposalStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      }),

      prisma.proposal.findMany({
        where: { counterpartId: userId, status: ProposalStatus.PENDING },
        include: {
          proposer: { select: { id: true, canTeach: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),

      prisma.proposal.findMany({
        where: { proposerId: userId, status: ProposalStatus.COUNTERED },
        orderBy: { updatedAt: 'desc' },
      }),
    ])

  const wantToLearn = sessionUser?.wantToLearn ?? []

  const matchedColleagues = wantToLearn.length > 0
    ? await prisma.user.findMany({
        where: {
          id: { not: userId },
          canTeach: { hasSome: wantToLearn },
        },
        select: { id: true, name: true, canTeach: true },
        orderBy: { name: 'asc' },
      })
    : []

  const callerCanTeach = sessionUser?.canTeach ?? []

  const totalActive = agreedProposals.length + receivedProposals.length + counterPendingProposals.length

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh' }}>

      {/* ── Top Navigation ── */}
      <header style={{ background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M3 5h10M3 8h7M3 11h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 10l2 2-2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#64748b' }}>
              Skill Swap Board
            </span>
          </div>

          <nav className="flex items-center gap-6">
            <Link
              href="/profile/me"
              className="text-xs font-medium transition-colors"
              style={{ color: '#64748b' }}
            >
              My Profile
            </Link>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: '#1e293b', color: '#f59e0b', border: '1px solid #334155' }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <form action={signOutUser}>
              <button
                type="submit"
                className="text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Sign Out
              </button>
            </form>
          </nav>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* ── Hero greeting ── */}
        <div className="mb-10">
          <h1
            className="text-3xl font-bold mb-1"
            style={{ color: '#f8fafc', fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Good day, {sessionUser?.name?.split(' ')[0] ?? userName}.
          </h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            {totalActive > 0
              ? `You have ${totalActive} active item${totalActive !== 1 ? 's' : ''} requiring attention.`
              : 'Everything is up to date. Browse profiles to propose new swaps.'}
          </p>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { label: 'Active Swaps', value: agreedProposals.length, accent: true },
            { label: 'Received', value: receivedProposals.length, accent: false },
            { label: 'Counter Offers', value: counterPendingProposals.length, accent: false },
            { label: 'Sent', value: sentProposals.length, accent: false },
          ].map(({ label, value, accent }) => (
            <div
              key={label}
              className="rounded-xl px-4 py-3"
              style={{
                background: accent && value > 0 ? 'rgba(245,158,11,0.08)' : '#1e293b',
                border: `1px solid ${accent && value > 0 ? 'rgba(245,158,11,0.2)' : '#334155'}`,
              }}
            >
              <div
                className="text-2xl font-bold"
                style={{ color: accent && value > 0 ? '#f59e0b' : '#f8fafc', fontFamily: 'Georgia, serif' }}
              >
                {value}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Browse Colleagues ── */}
        {matchedColleagues.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#f59e0b' }} />
              <div className="flex items-baseline gap-2 flex-1">
                <h2 className="text-sm font-semibold" style={{ color: '#cbd5e1' }}>Browse Colleagues</h2>
                <span className="text-xs" style={{ color: '#475569' }}>matched to your learning goals</span>
              </div>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}
              >
                {matchedColleagues.length}
              </span>
            </div>

            <div className="mb-4" style={{ height: 1, background: '#1e293b' }} />

            <div className="flex flex-col gap-3">
              {matchedColleagues.map((colleague) => {
                const matchedSkills = colleague.canTeach.filter((s) => wantToLearn.includes(s))
                const otherSkills = colleague.canTeach.filter((s) => !wantToLearn.includes(s))
                return (
                  <div
                    key={colleague.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{ background: '#1e293b', border: '1px solid #334155' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold mb-1.5" style={{ color: '#f8fafc' }}>{colleague.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedSkills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
                          >
                            {skill}
                          </span>
                        ))}
                        {otherSkills.map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: '#0f172a', color: '#475569', border: '1px solid #1e293b' }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link
                      href={`/profile/${colleague.id}`}
                      className="ml-4 flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}
                    >
                      Propose →
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Section helper ── */}
        {([
          {
            id: 'agreed',
            title: 'Agreed Swaps',
            description: 'Active teaching commitments',
            count: agreedProposals.length,
            dot: '#22c55e',
            empty: 'No agreed swaps yet — propose one from a colleague\'s profile.',
            items: agreedProposals,
            renderItem: (p: typeof agreedProposals[number]) => (
              <SwapCard key={p.id} proposal={p} viewerId={userId} />
            ),
          },
          {
            id: 'received',
            title: 'Received Proposals',
            description: 'Awaiting your response',
            count: receivedProposals.length,
            dot: '#f59e0b',
            empty: 'No incoming proposals right now.',
            items: receivedProposals,
            renderItem: (p: typeof receivedProposals[number]) => (
              <ProposalCard
                key={p.id}
                proposal={p}
                viewerId={userId}
                counterpartCanTeach={callerCanTeach}
                proposerCanTeach={p.proposer.canTeach}
              />
            ),
          },
          {
            id: 'counter',
            title: 'Counter Offers',
            description: 'Review and decide',
            count: counterPendingProposals.length,
            dot: '#a78bfa',
            empty: 'No counter offers awaiting your decision.',
            items: counterPendingProposals,
            renderItem: (p: typeof counterPendingProposals[number]) => (
              <ProposalCard key={p.id} proposal={p} viewerId={userId} />
            ),
          },
          {
            id: 'sent',
            title: 'Sent Proposals',
            description: 'Waiting on a response',
            count: sentProposals.length,
            dot: '#64748b',
            empty: 'No sent proposals awaiting response.',
            items: sentProposals,
            renderItem: (p: typeof sentProposals[number]) => (
              <ProposalCard key={p.id} proposal={p} viewerId={userId} />
            ),
          },
        ] as const).map(({ id, title, description, count, dot, empty, items, renderItem }) => (
          <section key={id} className="mb-10">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot }} />
              <div className="flex items-baseline gap-2 flex-1">
                <h2 className="text-sm font-semibold" style={{ color: '#cbd5e1' }}>
                  {title}
                </h2>
                <span className="text-xs" style={{ color: '#475569' }}>{description}</span>
              </div>
              {count > 0 && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}
                >
                  {count}
                </span>
              )}
            </div>

            {/* Divider */}
            <div className="mb-4" style={{ height: 1, background: '#1e293b' }} />

            {/* Items or empty state */}
            {(items as typeof items).length === 0 ? (
              <p className="text-sm py-2" style={{ color: '#334155', fontStyle: 'italic' }}>{empty}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {(items as typeof items).map((p) => renderItem(p as never))}
              </div>
            )}
          </section>
        ))}

      </main>
    </div>
  )
}
