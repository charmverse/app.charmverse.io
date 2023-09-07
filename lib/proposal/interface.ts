import type { Page, PageComment, Proposal } from '@charmverse/core/prisma';
import type { ProposalWithUsers } from '@charmverse/core/proposals';

import type { AssignablePermissionGroups } from 'lib/permissions/interfaces';

import type {
  ProposalRubricCriteriaAnswerWithTypedResponse,
  ProposalRubricCriteriaWithTypedParams
} from './rubric/interfaces';

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
  rubricAnswers: ProposalRubricCriteriaAnswerWithTypedResponse[];
  draftRubricAnswers: ProposalRubricCriteriaAnswerWithTypedResponse[];
};

export type ProposalWithUsersAndRubric = ProposalWithUsers &
  ProposalRubricData & { page?: { sourceTemplateId: string | null } | null };

export interface ProposalWithCommentsAndUsers extends ProposalWithUsers {
  page: Page & { comments: PageComment[] };
}
