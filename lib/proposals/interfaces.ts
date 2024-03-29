import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type {
  FormField,
  Page,
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
import type { ProjectFieldConfig, ProjectWithMembers } from 'lib/projects/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

import type { ProposalPropertiesField } from './blocks/interfaces';
import type { ProposalRubricCriteriaAnswerWithTypedResponse, RubricCriteriaTyped } from './rubric/interfaces';

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

export type VoteSettings = Pick<
  Vote,
  'type' | 'threshold' | 'maxChoices' | 'blockNumber' | 'tokenAddress' | 'chainId' | 'strategy'
> & {
  durationDays: number;
  options: string[];
};

export type TypedFormField = Omit<FormField, 'options'> & {
  options: SelectOptionType[];
};

export type ProposalPendingReward = { reward: UpdateableRewardFields; page: NewPageValues; draftId: string };

export type ProposalFields = {
  properties?: ProposalPropertiesField;
  pendingRewards?: ProposalPendingReward[];
  rewardsTemplateId?: string; // require a particular template to be used for rewards
  enableRewards?: boolean; // used by form templates to enable rewards for new proposals
};

export type PopulatedEvaluation = Omit<ProposalEvaluation, 'voteSettings'> & {
  draftRubricAnswers: ProposalRubricCriteriaAnswerWithTypedResponse[];
  rubricAnswers: ProposalRubricCriteriaAnswerWithTypedResponse[];
  rubricCriteria: RubricCriteriaTyped[];
  permissions: ProposalEvaluationPermission[];
  reviewers: ProposalReviewer[];
  voteSettings: VoteSettings | null;
  isReviewer?: boolean; // added by the webapp api
};

export type ProposalWithUsersAndRubric = Omit<Proposal, 'fields'> & {
  authors: ProposalAuthor[];
  rewardIds?: string[] | null;
  evaluations: PopulatedEvaluation[];
  fields: ProposalFields | null;
  page?: Partial<Pick<Page, 'sourceTemplateId' | 'content' | 'contentText' | 'type'>> | null;
  permissions: ProposalPermissionFlags;
  currentEvaluationId?: string;
  form: {
    id: string;
    formFields: TypedFormField[] | null;
  } | null;
  project?: ProjectWithMembers;
};
