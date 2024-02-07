import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type {
  FormField,
  Page,
  PageComment,
  Proposal,
  ProposalAuthor,
  ProposalReviewer,
  ProposalEvaluation,
  ProposalEvaluationPermission,
  ProposalEvaluationResult,
  ProposalEvaluationType,
  Vote
} from '@charmverse/core/prisma';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { NewPageValues } from 'components/common/PageDialog/hooks/useNewPage';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

import type { ProposalPropertiesField } from './blocks/interfaces';
import type { ProposalStep } from './getCurrentStep';
import type {
  ProposalRubricCriteriaAnswerWithTypedResponse,
  ProposalRubricCriteriaWithTypedParams
} from './rubric/interfaces';

export type ProposalEvaluationStatus =
  | 'in_progress'
  | 'complete'
  | 'passed'
  | 'declined'
  | 'unpublished'
  | 'published'
  | 'archived';
export type ProposalEvaluationStep = ProposalEvaluationType | 'rewards' | 'draft';
export type ProposalEvaluationResultExtended = ProposalEvaluationResult | 'in_progress';

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
export type ProposalFields = {
  properties?: ProposalPropertiesField;
  pendingRewards?: ProposalPendingReward[];
  rewardsTemplateId?: string; // require a particular template to be used for rewards
  enableRewards?: boolean; // used by form templates to enable rewards for new proposals
};
type ProposalFormData = {
  form: {
    id: string;
    formFields:
      | (Omit<FormField, 'options'> & {
          options: SelectOptionType[];
        })[]
      | null;
  };
};

export type ProposalWithUsers = Omit<Proposal, 'fields'> & {
  authors: ProposalAuthor[];
  fields: ProposalFields | null;
  reviewers: ProposalReviewer[];
  rewardIds?: string[] | null;
};

export type ProposalWithUsersLite = ProposalWithUsers & {
  currentEvaluationId?: string;
  permissions?: ProposalPermissionFlags;
  evaluations: {
    title: string;
    type: ProposalEvaluationType;
    id: string;
    result: ProposalEvaluationResult | null;
    index: number;
  }[];
  currentStep: ProposalStep;
};

export type PopulatedEvaluation = ProposalRubricData &
  Omit<ProposalEvaluation, 'voteSettings'> & {
    permissions: ProposalEvaluationPermission[];
    reviewers: ProposalWithUsers['reviewers'];
    voteSettings: VoteSettings | null;
    isReviewer?: boolean; // added by the webapp api
  };

export type ProposalWithUsersAndRubric = ProposalWithUsers &
  // ProposalRubricData &
  ProposalFormData & {
    // currentStep: ProposalStep;
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
