import { ProposalStatus } from '@/lib/enums'

export type GuardProposal = {
  status: string
  proposerId: string
  counterpartId: string
}

/** Returns true if skill is in the given list. */
export function isSkillInList(skill: string, list: string[]): boolean {
  return list.includes(skill)
}

/** Only the counterpart may accept a PENDING proposal. */
export function canAccept(proposal: GuardProposal, callerId: string): boolean {
  return proposal.counterpartId === callerId && proposal.status === ProposalStatus.PENDING
}

/** Only the counterpart may counter a PENDING proposal. */
export function canCounter(proposal: GuardProposal, callerId: string): boolean {
  return proposal.counterpartId === callerId && proposal.status === ProposalStatus.PENDING
}

/**
 * The counterpart may decline a PENDING proposal.
 * The proposer may decline a COUNTERED proposal.
 */
export function canDecline(proposal: GuardProposal, callerId: string): boolean {
  const isCounterpart = proposal.counterpartId === callerId
  const isProposer = proposal.proposerId === callerId
  return (
    (isCounterpart && proposal.status === ProposalStatus.PENDING) ||
    (isProposer && proposal.status === ProposalStatus.COUNTERED)
  )
}

/** Either party may cancel an AGREED swap. */
export function canCancel(proposal: GuardProposal, callerId: string): boolean {
  const isParty =
    proposal.proposerId === callerId || proposal.counterpartId === callerId
  return isParty && proposal.status === ProposalStatus.AGREED
}
