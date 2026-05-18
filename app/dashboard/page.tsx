import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ProposalStatus } from '@/lib/enums'
import Link from 'next/link'
import StatsCard from '@/components/StatsCard'
import ProposalCard from '@/components/ProposalCard'
import { signOutUser } from '@/actions/auth'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const userId = session.user.id
  const userName = session.user.name ?? 'there'

  const [sessionUser, agreedProposals, receivedProposals, counterPendingProposals, sentProposals] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, canTeach: true } }),

      prisma.proposal.findMany({
        where: {
          OR: [{ proposerId: userId }, { counterpartId: userId }],
          status: ProposalStatus.AGREED,
        },
        orderBy: { updatedAt: 'desc' },
      }),

      prisma.proposal.findMany({
        where: { counterpartId: userId, status: ProposalStatus.PENDING },
        include: { proposer: { select: { id: true, canTeach: true } } },
        orderBy: { updatedAt: 'desc' },
      }),

      prisma.proposal.findMany({
        where: { proposerId: userId, status: ProposalStatus.COUNTERED },
        orderBy: { updatedAt: 'desc' },
      }),

      prisma.proposal.findMany({
        where: { proposerId: userId, status: ProposalStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      }),
    ])

  const callerCanTeach = sessionUser?.canTeach ?? []
  const needsAttention = [
    ...receivedProposals.map((p) => ({ ...p, _variant: 'received' as const })),
    ...counterPendingProposals.map((p) => ({ ...p, _variant: 'counter' as const })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

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
            <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#64748b' }}>
              Skill Swap Board
            </span>
          </div>

          <nav className="flex items-center gap-6">
            <Link
              href="/profile/me"
              className="text-sm font-medium transition-colors"
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
                className="text-sm font-medium transition-colors hover:opacity-80"
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
          <p className="text-base" style={{ color: '#64748b' }}>
            {needsAttention.length > 0
              ? `You have ${needsAttention.length} item${needsAttention.length !== 1 ? 's' : ''} requiring your attention.`
              : 'Everything is up to date. Browse colleagues to propose new swaps.'}
          </p>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatsCard label="Active Swaps"   value={agreedProposals.length} highlight />
          <StatsCard label="Received"       value={receivedProposals.length} />
          <StatsCard label="Counter Offers" value={counterPendingProposals.length} />
          <StatsCard label="Sent"           value={sentProposals.length} />
        </div>

        {/* ── Agreed swaps summary banner ── */}
        {agreedProposals.length > 0 && (
          <Link
            href="/proposals"
            className="flex items-center justify-between rounded-xl px-4 py-3 mb-10 transition-opacity hover:opacity-80"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: '#f59e0b' }}>✓</span>
              <span className="text-sm font-medium" style={{ color: '#f8fafc' }}>
                {agreedProposals.length} active swap commitment{agreedProposals.length !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-sm" style={{ color: '#f59e0b' }}>See all in Proposals →</span>
          </Link>
        )}

        {/* ── Needs Attention ── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#f59e0b' }} />
            <div className="flex items-baseline gap-2 flex-1">
              <h2 className="text-base font-semibold" style={{ color: '#cbd5e1' }}>Needs Attention</h2>
              <span className="text-sm" style={{ color: '#475569' }}>proposals requiring your response</span>
            </div>
            {needsAttention.length > 0 && (
              <span
                className="text-sm font-medium px-2 py-0.5 rounded-full"
                style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}
              >
                {needsAttention.length}
              </span>
            )}
          </div>

          <div className="mb-4" style={{ height: 1, background: '#1e293b' }} />

          {needsAttention.length === 0 ? (
            <p className="text-base py-2" style={{ color: '#475569', fontStyle: 'italic' }}>
              Everything is up to date. Browse colleagues to propose new swaps.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {needsAttention.map((p) =>
                p._variant === 'received' ? (
                  <ProposalCard
                    key={p.id}
                    proposal={p}
                    viewerId={userId}
                    variant="received"
                    counterpartCanTeach={callerCanTeach}
                    proposerCanTeach={(p as typeof receivedProposals[number]).proposer?.canTeach ?? []}
                  />
                ) : (
                  <ProposalCard
                    key={p.id}
                    proposal={p}
                    viewerId={userId}
                    variant="counter"
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* ── Footer link ── */}
        <div className="flex justify-center">
          <Link
            href="/proposals"
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: '#f59e0b' }}
          >
            See all proposals in Proposals →
          </Link>
        </div>

      </main>
    </div>
  )
}
