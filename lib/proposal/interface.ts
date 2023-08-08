import type {
  Page,
  PageComment,
  Proposal,
  ProposalAuthor,
  ProposalReviewer,
  ProposalRubricCriteria,
  ProposalRubricCriteriaAnswer
} from '@charmverse/core/prisma';
import type { ProposalWithUsers } from '@charmverse/core/proposals';

import type { AssignablePermissionGroups } from 'lib/permissions/interfaces';

import type { ProposalRubricCriteriaWithTypedParams } from './rubric/interfaces';

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

export type ProposalRubricData = {
  rubricCriteria: ProposalRubricCriteriaWithTypedParams[];
  rubricAnswers: ProposalRubricCriteriaAnswer[];
};

export type ProposalWithUsersAndRubric = ProposalWithUsers & ProposalRubricData;

export interface ProposalWithCommentsAndUsers extends ProposalWithUsers {
  page: Page & { comments: PageComment[] };
}
