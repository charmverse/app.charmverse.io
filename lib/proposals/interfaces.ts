import { Proposal, ProposalStatus } from '@prisma/client';
import { IPageWithPermissions } from 'lib/pages/interfaces';
import { ExtendedVote } from 'lib/votes/interfaces';

export interface ProposalCreationData {
  userId: string;
  spaceId: string;
}

export interface ProposalWithVote extends Proposal {
  vote?: ExtendedVote;
}

export interface PageWithProposal extends IPageWithPermissions {
  type: 'proposal',
  proposal: ProposalWithVote
}

export const proposalStatusLabels: Record<ProposalStatus, string> = {
  in_progress: 'Complete',
  complete: 'Complete',
  draft: 'Draft',
  cancelled: 'Cancelled'
};
