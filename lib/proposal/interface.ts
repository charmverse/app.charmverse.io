import { Proposal, ProposalAuthor, ProposalReviewer } from '@prisma/client';
import { AssignablePermissionGroups } from 'lib/permissions/interfaces';

export interface ProposalReviewerInput {
  group: Extract<AssignablePermissionGroups, 'role' | 'user'>
  id: string
}

export interface ProposalWithUsers extends Proposal {
  authors: ProposalAuthor[],
  reviewers: ProposalReviewer[]
}

export interface UpdateProposalRequest {
  authors: string[]
  reviewers: ProposalReviewerInput[]
}
