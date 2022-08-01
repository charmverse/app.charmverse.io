import { Proposal } from '@prisma/client';
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
  proposal: ProposalWithVote
}
