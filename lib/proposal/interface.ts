import type {
  Page,
  PageComment,
  Proposal,
  ProposalEvaluation,
  ProposalEvaluationPermission
} from '@charmverse/core/prisma';
import type { ProposalWithUsers } from '@charmverse/core/proposals';

import type {
  ProposalRubricCriteriaAnswerWithTypedResponse,
  ProposalRubricCriteriaWithTypedParams
} from './rubric/interfaces';

export interface ProposalReviewerInput {
  group: 'system_role' | 'role' | 'user';
  id: string;
  evaluationId?: string;
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

export type PopulatedEvaluation = ProposalRubricData &
  ProposalEvaluation & {
    permissions: ProposalEvaluationPermission[];
    reviewers: ProposalWithUsers['reviewers'];
  };

export type ProposalWithUsersAndRubric = ProposalWithUsers &
  ProposalRubricData & {
    evaluations: PopulatedEvaluation[];
    page?: { sourceTemplateId: string | null } | null;
  };

export interface ProposalWithCommentsAndUsers extends ProposalWithUsers {
  page: Page & { comments: PageComment[] };
}
