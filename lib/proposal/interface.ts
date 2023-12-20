import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type {
  FormField,
  Page,
  PageComment,
  Proposal,
  ProposalEvaluation,
  ProposalEvaluationPermission,
  Vote
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

export type VoteSettings = Pick<Vote, 'type' | 'threshold' | 'maxChoices'> & {
  durationDays: number;
  options: string[];
};

export type ProposalFormData = {
  formFields: FormField[] | null;
};

export type PopulatedEvaluation = ProposalRubricData &
  Omit<ProposalEvaluation, 'voteSettings'> & {
    permissions: ProposalEvaluationPermission[];
    reviewers: ProposalWithUsers['reviewers'];
    voteSettings: VoteSettings | null;
  };

export type ProposalWithUsersAndRubric = ProposalWithUsers &
  ProposalRubricData &
  ProposalFormData & {
    evaluations: PopulatedEvaluation[];
    page?: { sourceTemplateId: string | null } | null;
    permissions: ProposalPermissionFlags;
    currentEvaluationId?: string;
  };
export interface ProposalWithCommentsAndUsers extends ProposalWithUsers {
  page: Page & { comments: PageComment[] };
}
