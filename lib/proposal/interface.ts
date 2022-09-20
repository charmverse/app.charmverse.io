import type { Proposal, ProposalAuthor, ProposalReviewer } from '@prisma/client';
import { ProposalStatus } from '@prisma/client';
import type { AssignablePermissionGroups } from 'lib/permissions/interfaces';

export interface ProposalReviewerInput {
  group: Extract<AssignablePermissionGroups, 'role' | 'user'>
  id: string
}

export interface ProposalWithUsers extends Proposal {
  authors: ProposalAuthor[],
  reviewers: ProposalReviewer[]
}
