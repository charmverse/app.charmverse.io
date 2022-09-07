import { Page, Proposal, ProposalAuthor, ProposalReviewer, Space } from '@prisma/client';

export interface ProposalWithUsers extends Proposal {
  authors: ProposalAuthor[],
  reviewers: ProposalReviewer[]
}

export interface ExtendedProposal extends ProposalWithUsers {
  space: Space
  page: Page
}
