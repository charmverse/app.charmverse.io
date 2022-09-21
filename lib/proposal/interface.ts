import type { Proposal, ProposalAuthor, ProposalReviewer } from '@prisma/client';
import type { AssignablePermissionGroups } from 'lib/permissions/interfaces';

export interface ProposalReviewerInput {
  group: Extract<AssignablePermissionGroups, 'role' | 'user'>
  id: string
}

export interface ProposalCategory {
  id: string;
  title: string;
  color: string;
  spaceId: string;
}

export interface ProposalWithCategory extends Proposal {
  category: ProposalCategory | null;
}

export interface ProposalWithUsers extends Proposal, ProposalWithCategory {
  authors: ProposalAuthor[],
  reviewers: ProposalReviewer[]
}

