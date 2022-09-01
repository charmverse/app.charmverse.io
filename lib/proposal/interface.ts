import { Proposal, ProposalAuthor, ProposalReviewer } from '@prisma/client';

export interface ProposalWithUsers extends Proposal {
  authors: ProposalAuthor[],
  reviewers: ProposalReviewer[]
}
