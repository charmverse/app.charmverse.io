import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type {
  FormField,
  Page,
  PageComment,
  ProposalReviewer,
  ProposalEvaluation,
  ProposalEvaluationPermission,
  ProposalEvaluationType,
  Vote
} from '@charmverse/core/prisma';
import type { ProposalWithUsers as CoreProposalWithUsers } from '@charmverse/core/proposals';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { NewPageValues } from 'components/common/PageDialog/hooks/useNewPage';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

import type { ProposalPropertiesField } from './blocks/interfaces';
import type {
  ProposalRubricCriteriaAnswerWithTypedResponse,
  ProposalRubricCriteriaWithTypedParams
} from './rubric/interfaces';

export interface ProposalReviewerInput {
  group: 'system_role' | 'role' | 'user';
  id: string;
  evaluationId?: string;
}

export type ProposalRubricData = {
  rubricCriteria: ProposalRubricCriteriaWithTypedParams[];
  rubricAnswers: ProposalRubricCriteriaAnswerWithTypedResponse[];
  draftRubricAnswers: ProposalRubricCriteriaAnswerWithTypedResponse[];
};

export type VoteSettings = Pick<Vote, 'type' | 'threshold' | 'maxChoices'> & {
  durationDays: number;
  options: string[];
  publishToSnapshot: boolean;
};

export type ProposalPendingReward = { reward: UpdateableRewardFields; page: NewPageValues | null; draftId: string };
export type ProposalFields = { properties?: ProposalPropertiesField; pendingRewards?: ProposalPendingReward[] };
export type ProposalFormData = {
  form: {
    id: string;
    formFields:
      | (Omit<FormField, 'options'> & {
          options: SelectOptionType[];
        })[]
      | null;
  };
};

export type ProposalWithUsers = Omit<CoreProposalWithUsers, 'fields'> & {
  fields: ProposalFields | null;
};

export type ProposalWithUsersLite = Omit<ProposalWithUsers, 'reviewers'> & {
  // currentEvaluationId?: string;
  evaluationType: ProposalEvaluationType;
  permissions?: ProposalPermissionFlags;
  currentEvaluation?: Pick<ProposalEvaluation, 'id' | 'title' | 'type' | 'result'> & {
    reviewers: ProposalReviewer[];
  };
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
    fields: ProposalFields | null;
    page?: { sourceTemplateId: string | null } | null;
    permissions: ProposalPermissionFlags;
    currentEvaluationId?: string;
    form?: {
      formFields:
        | (Omit<FormField, 'options'> & {
            options: SelectOptionType[];
          })[]
        | null;
    };
  };

export interface ProposalWithCommentsAndUsers extends ProposalWithUsers {
  page: Page & { comments: PageComment[] };
}
