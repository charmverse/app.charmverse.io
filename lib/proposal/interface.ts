import { Proposal, ProposalAuthor, ProposalReviewer } from '@prisma/client';

export interface UpdateProposalRequest {
  authors: string[]
  reviewers: string[]
}

export type ProposalWithUsers = Proposal & {authors: ProposalAuthor[], reviewers: ProposalReviewer[]}
