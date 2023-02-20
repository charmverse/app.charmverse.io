import type { ProposalResource } from '../permissions/proposals/computeProposalPermissions/interfaces';

export function isProposalAuthor({
  userId,
  proposal
}: {
  userId?: string;
  proposal: Pick<ProposalResource, 'createdBy' | 'authors'>;
}): boolean {
  if (!userId) {
    return false;
  }

  return proposal.authors.some((a) => a.userId === userId) || proposal.createdBy === userId;
}
