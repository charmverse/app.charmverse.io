import { Proposal, ProposalAuthor, ProposalReviewer, ProposalReviewerGroup } from '@prisma/client';

export interface UpdateProposalRequest {
  authors: string[]
  reviewers: {
    group: ProposalReviewerGroup
    id: string
  }[]
}

export type ProposalWithUsers = Proposal & {authors: ProposalAuthor[], reviewers: ProposalReviewer[]}
