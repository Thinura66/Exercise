'use server'

import { revalidatePath } from 'next/cache'
import { ProposalStatus } from '@/lib/enums'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-helpers'
import { isSkillInList, canAccept, canCounter, canDecline, canCancel } from '@/lib/guards'

export type ProposalActionState = { success: false; error: string } | null

// ─── createProposal ────────────────────────────────────────────────

export async function createProposal(
  _prev: ProposalActionState,
  formData: FormData,
): Promise<ProposalActionState> {
  const userIdOrError = await getAuthenticatedUserId()
  if (typeof userIdOrError !== 'string') return userIdOrError

  const counterpartId = formData.get('counterpartId') as string
  const offeredSkill = formData.get('offeredSkill') as string
  const requestedSkill = formData.get('requestedSkill') as string

  if (!counterpartId || !offeredSkill || !requestedSkill) {
    return { success: false, error: 'All fields are required.' }
  }

  const [caller, counterpart] = await Promise.all([
    prisma.user.findUnique({ where: { id: userIdOrError }, select: { canTeach: true } }),
    prisma.user.findUnique({ where: { id: counterpartId }, select: { canTeach: true } }),
  ])

  if (!isSkillInList(offeredSkill, caller?.canTeach ?? [])) {
    return { success: false, error: "You can only offer skills from your 'can teach' list" }
  }
  if (!isSkillInList(requestedSkill, counterpart?.canTeach ?? [])) {
    return { success: false, error: "That skill is not in the other user's 'can teach' list" }
  }

  const existing = await prisma.proposal.findFirst({
    where: {
      OR: [
        { proposerId: userIdOrError, counterpartId },
        { proposerId: counterpartId, counterpartId: userIdOrError },
      ],
      status: { in: [ProposalStatus.PENDING, ProposalStatus.AGREED] },
    },
  })
  if (existing) {
    return { success: false, error: 'A proposal is already open between you and this user' }
  }

  await prisma.proposal.create({
    data: {
      proposerId: userIdOrError,
      counterpartId,
      offeredSkill,
      requestedSkill,
    },
  })

  revalidatePath('/dashboard')
  return null
}

// ─── respondToProposal ─────────────────────────────────────────────

export async function respondToProposal(
  _prev: ProposalActionState,
  formData: FormData,
): Promise<ProposalActionState> {
  const userIdOrError = await getAuthenticatedUserId()
  if (typeof userIdOrError !== 'string') return userIdOrError

  const proposalId = formData.get('proposalId') as string
  const action = formData.get('action') as 'accept' | 'decline' | 'counter'
  const counterOfferedSkill = (formData.get('counterOfferedSkill') as string | null) ?? ''
  const counterRequestedSkill = (formData.get('counterRequestedSkill') as string | null) ?? ''

  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      proposer: { select: { canTeach: true } },
      counterpart: { select: { canTeach: true } },
    },
  })

  if (!proposal) return { success: false, error: 'Proposal not found.' }

  const isProposer = proposal.proposerId === userIdOrError
  const isCounterpart = proposal.counterpartId === userIdOrError

  if (!isProposer && !isCounterpart) {
    return { success: false, error: 'You are not authorised to act on this proposal' }
  }

  if (action === 'accept') {
    if (!canAccept(proposal, userIdOrError)) {
      return { success: false, error: 'This proposal is no longer open' }
    }
    await prisma.proposal.update({ where: { id: proposalId }, data: { status: ProposalStatus.AGREED } })
  }

  if (action === 'decline') {
    if (!canDecline(proposal, userIdOrError)) {
      return { success: false, error: 'This proposal is no longer open' }
    }
    await prisma.proposal.update({ where: { id: proposalId }, data: { status: ProposalStatus.DECLINED } })
  }

  if (action === 'counter') {
    if (!canCounter(proposal, userIdOrError)) {
      return { success: false, error: 'This proposal is no longer open' }
    }
    if (!counterOfferedSkill || !counterRequestedSkill) {
      return { success: false, error: 'Both counter skills are required.' }
    }
    if (!isSkillInList(counterOfferedSkill, proposal.counterpart.canTeach)) {
      return { success: false, error: "You can only offer skills from your 'can teach' list" }
    }
    if (!isSkillInList(counterRequestedSkill, proposal.proposer.canTeach)) {
      return { success: false, error: "That skill is not in the proposer's 'can teach' list" }
    }
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.COUNTERED, counterOfferedSkill, counterRequestedSkill },
    })
  }

  revalidatePath('/dashboard')
  return null
}

// ─── acceptCounter ─────────────────────────────────────────────────

export async function acceptCounter(
  _prev: ProposalActionState,
  formData: FormData,
): Promise<ProposalActionState> {
  const userIdOrError = await getAuthenticatedUserId()
  if (typeof userIdOrError !== 'string') return userIdOrError

  const proposalId = formData.get('proposalId') as string

  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } })

  if (!proposal) return { success: false, error: 'Proposal not found.' }
  if (proposal.proposerId !== userIdOrError) {
    return { success: false, error: 'You are not authorised to act on this proposal' }
  }
  if (proposal.status !== ProposalStatus.COUNTERED) {
    return { success: false, error: 'This proposal is no longer open' }
  }

  await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      status: ProposalStatus.AGREED,
      offeredSkill: proposal.counterOfferedSkill!,
      requestedSkill: proposal.counterRequestedSkill!,
      counterOfferedSkill: null,
      counterRequestedSkill: null,
    },
  })

  revalidatePath('/dashboard')
  return null
}

// ─── cancelSwap ────────────────────────────────────────────────────

export async function cancelSwap(
  _prev: ProposalActionState,
  formData: FormData,
): Promise<ProposalActionState> {
  const userIdOrError = await getAuthenticatedUserId()
  if (typeof userIdOrError !== 'string') return userIdOrError

  const proposalId = formData.get('proposalId') as string

  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } })

  if (!proposal) return { success: false, error: 'Proposal not found.' }

  if (!canCancel(proposal, userIdOrError)) {
    return { success: false, error: 'This proposal is no longer open' }
  }

  await prisma.proposal.update({ where: { id: proposalId }, data: { status: ProposalStatus.CANCELLED } })

  revalidatePath('/dashboard')
  return null
}
