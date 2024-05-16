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
  Vote,
  ProposalEvaluationReview,
  ProposalAppealReviewer
} from '@charmverse/core/prisma';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { NewPageValues } from 'components/common/PageDialog/hooks/useNewPage';
import type { EASAttestationFromApi } from 'lib/credentials/external/getOnchainCredentials';
import type { ProjectWithMembers } from 'lib/projects/interfaces';
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
export type ProposalEvaluationStep = ProposalEvaluationType | 'rewards' | 'credentials' | 'draft';
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

export type ConcealableEvaluationType = ProposalEvaluationType | 'private_evaluation';

export type PopulatedEvaluation = Omit<ProposalEvaluation, 'voteSettings' | 'actionLabels' | 'type'> & {
  draftRubricAnswers: ProposalRubricCriteriaAnswerWithTypedResponse[];
  rubricAnswers: ProposalRubricCriteriaAnswerWithTypedResponse[];
  rubricCriteria: RubricCriteriaTyped[];
  permissions: ProposalEvaluationPermission[];
  reviewers: ProposalReviewer[];
  appealReviewers?: ProposalAppealReviewer[];
  voteSettings: VoteSettings | null;
  isReviewer?: boolean; // added by the webapp api
  requiredReviews: number;
  appealable: boolean;
  appealRequiredReviews?: number;
  declineReasonOptions: string[];
  reviews?: ProposalEvaluationReview[];
  actionLabels?: WorkflowEvaluationJson['actionLabels'];
  type: ConcealableEvaluationType;
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
  project?: ProjectWithMembers | null;
  issuedCredentials: EASAttestationFromApi[];
};
