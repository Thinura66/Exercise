import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ProposalStatus } from '@prisma/client'
import SwapCard from '@/components/SwapCard'
import ProposalCard from '@/components/ProposalCard'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const userId = session.user.id

  const [sessionUser, agreedProposals, sentProposals, receivedProposals, counterPendingProposals] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { canTeach: true } }),

      // AGREED — viewer is party, include both parties' emails
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

      // Sent PENDING — viewer is proposer, waiting on counterpart
      prisma.proposal.findMany({
        where: { proposerId: userId, status: ProposalStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      }),

      // Received PENDING — viewer is counterpart, can accept/decline/counter
      prisma.proposal.findMany({
        where: { counterpartId: userId, status: ProposalStatus.PENDING },
        include: {
          proposer: { select: { id: true, canTeach: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Counter-pending — viewer is proposer, proposal was countered
      prisma.proposal.findMany({
        where: { proposerId: userId, status: ProposalStatus.COUNTERED },
        orderBy: { updatedAt: 'desc' },
      }),
    ])

  const callerCanTeach = sessionUser?.canTeach ?? []

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      {/* ── Agreed Swaps ── */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Agreed Swaps</h2>
        {agreedProposals.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No agreed swaps yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {agreedProposals.map((p) => (
              <SwapCard
                key={p.id}
                proposal={p}
                viewerId={userId}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Received Proposals ── */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Received Proposals</h2>
        {receivedProposals.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No incoming proposals.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {receivedProposals.map((p) => (
              <ProposalCard
                key={p.id}
                proposal={p}
                viewerId={userId}
                counterpartCanTeach={callerCanTeach}
                proposerCanTeach={p.proposer.canTeach}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Counter Offers Awaiting Your Decision ── */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Counter Offers</h2>
        {counterPendingProposals.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No counter offers awaiting your decision.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {counterPendingProposals.map((p) => (
              <ProposalCard
                key={p.id}
                proposal={p}
                viewerId={userId}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Sent Proposals ── */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Sent Proposals</h2>
        {sentProposals.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No sent proposals awaiting response.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {sentProposals.map((p) => (
              <ProposalCard
                key={p.id}
                proposal={p}
                viewerId={userId}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
