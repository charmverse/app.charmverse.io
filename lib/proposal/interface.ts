import type { Page, PageComment, Proposal, ProposalAuthor, ProposalReviewer } from '@prisma/client';

import type { AssignablePermissionGroups } from 'lib/permissions/interfaces';

export interface ProposalReviewerInput {
  group: Extract<AssignablePermissionGroups, 'role' | 'user'>;
  id: string;
}

export interface NewProposalCategory {
  title: string;
  color: string;
}

export interface ProposalCategory extends NewProposalCategory {
  id: string;
  spaceId: string;
}

export interface ProposalWithCategory extends Proposal {
  category: ProposalCategory | null;
}

export interface ProposalWithUsers extends Proposal, ProposalWithCategory {
  authors: ProposalAuthor[];
  reviewers: ProposalReviewer[];
}

export interface ProposalWithCommentsAndUsers extends ProposalWithUsers {
  page: Page & { comments: PageComment[] };
}
