import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ProposalStatus } from '@/lib/enums'
import Link from 'next/link'
import ProposalCard from '@/components/ProposalCard'
import SwapCard from '@/components/SwapCard'
import { signOutUser } from '@/actions/auth'

export default async function ProposalsPage() {
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
        include: {
          proposer: { select: { id: true, name: true, email: true } },
          counterpart: { select: { id: true, name: true, email: true } },
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

  const sections = [
    {
      id: 'received',
      title: 'Received',
      dot: '#f59e0b',
      empty: 'No incoming proposals right now.',
      items: receivedProposals,
      renderItem: (p: typeof receivedProposals[number]) => (
        <ProposalCard
          key={p.id}
          proposal={p}
          viewerId={userId}
          variant="received"
          counterpartCanTeach={callerCanTeach}
          proposerCanTeach={p.proposer.canTeach}
        />
      ),
    },
    {
      id: 'counter',
      title: 'Counter Offers',
      dot: '#a78bfa',
      empty: 'No counter offers awaiting your decision.',
      items: counterPendingProposals,
      renderItem: (p: typeof counterPendingProposals[number]) => (
        <ProposalCard key={p.id} proposal={p} viewerId={userId} variant="counter" />
      ),
    },
    {
      id: 'sent',
      title: 'Sent',
      dot: '#64748b',
      empty: 'No sent proposals awaiting response.',
      items: sentProposals,
      renderItem: (p: typeof sentProposals[number]) => (
        <ProposalCard key={p.id} proposal={p} viewerId={userId} />
      ),
    },
    {
      id: 'agreed',
      title: 'Agreed',
      dot: '#22c55e',
      empty: "No agreed swaps yet — propose one from a colleague's profile.",
      items: agreedProposals,
      renderItem: (p: typeof agreedProposals[number]) => (
        <SwapCard key={p.id} proposal={p} viewerId={userId} />
      ),
    },
  ] as const

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
            <Link href="/dashboard" className="text-sm font-medium" style={{ color: '#64748b' }}>
              Dashboard
            </Link>
            <Link href="/profile/me" className="text-sm font-medium" style={{ color: '#64748b' }}>
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
                className="text-sm font-medium hover:opacity-80"
                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Sign Out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">

        <div className="mb-10">
          <h1
            className="text-3xl font-bold mb-1"
            style={{ color: '#f8fafc', fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Proposals
          </h1>
          <p className="text-base" style={{ color: '#64748b' }}>
            All your skill swap proposals in one place.
          </p>
        </div>

        {sections.map(({ id, title, dot, empty, items, renderItem }) => (
          <section key={id} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot }} />
              <h2 className="text-base font-semibold flex-1" style={{ color: '#cbd5e1' }}>{title}</h2>
              {items.length > 0 && (
                <span
                  className="text-sm font-medium px-2 py-0.5 rounded-full"
                  style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}
                >
                  {items.length}
                </span>
              )}
            </div>

            <div className="mb-4" style={{ height: 1, background: '#1e293b' }} />

            {items.length === 0 ? (
              <p className="text-base py-2" style={{ color: '#475569', fontStyle: 'italic' }}>{empty}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map(renderItem as (p: typeof items[number]) => React.ReactNode)}
              </div>
            )}
          </section>
        ))}

      </main>
    </div>
  )
}
