import { objectUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import type { IPropertyTemplate, ProposalPropertyType } from 'lib/databases/board';
import type { Constants } from 'lib/databases/constants';
import {
  AUTHORS_BLOCK_ID,
  CREATED_AT_ID,
  PROPOSAL_REVIEWERS_BLOCK_ID,
  PROPOSAL_STATUS_BLOCK_ID
} from 'lib/proposals/blocks/constants';
import type {
  ProposalEvaluationResultExtended,
  ProposalEvaluationStatus,
  ProposalEvaluationStep
} from 'lib/proposals/interfaces';
import type { BrandColor } from 'theme/colors';

export const EVALUATION_STATUS_LABELS: Record<ProposalEvaluationStatus, string> = {
  complete: 'Complete',
  declined: 'Declined',
  in_progress: 'In Progress',
  passed: 'Passed',
  published: 'Published',
  unpublished: 'Unpublished',
  archived: 'Archived'
};

export const proposalStatusColors: Record<ProposalEvaluationStatus, BrandColor> = {
  complete: 'green',
  declined: 'red',
  in_progress: 'yellow',
  passed: 'green',
  published: 'green',
  unpublished: 'gray',
  archived: 'gray'
};

export const proposalDbProperties: {
  [key in ProposalPropertyType]: (args?: { name?: string; options?: string[] }) => IPropertyTemplate;
} = {
  proposalReviewerNotes: () => ({
    id: uuid(),
    name: 'Reviewer Notes',
    options: [],
    type: 'proposalReviewerNotes'
  }),
  proposalStatus: ({ name } = {}) => ({
    id: PROPOSAL_STATUS_BLOCK_ID,
    name: name || 'Proposal Status',
    options: objectUtils.typedKeys(EVALUATION_STATUS_LABELS).map((status) => ({
      color: proposalStatusColors[status],
      id: status,
      value: status
    })),
    type: 'proposalStatus'
  }),
  proposalStep: ({ name, options = [] } = {}) => ({
    id: PROPOSAL_STEP_BLOCK_ID,
    name: name || 'Proposal Step',
    options: options.map((title) => ({
      color: 'propColorGray',
      id: title,
      value: title
    })),
    type: 'proposalStep'
  }),
  proposalUrl: () => ({
    id: uuid(),
    name: 'Proposal Url',
    options: [],
    type: 'proposalUrl'
  }),
  proposalEvaluatedBy: () => ({
    id: uuid(),
    name: 'Proposal Evaluated By',
    options: [],
    type: 'proposalEvaluatedBy'
  }),
  proposalEvaluationAverage: () => ({
    id: uuid(),
    name: 'Proposal Evaluation Average',
    options: [],
    type: 'proposalEvaluationAverage'
  }),
  proposalEvaluationTotal: () => ({
    id: uuid(),
    name: 'Proposal Evaluation Total',
    options: [],
    type: 'proposalEvaluationTotal'
  }),
  proposalAuthor: ({ name } = {}) => ({
    id: AUTHORS_BLOCK_ID,
    name: name || 'Proposal Authors',
    options: [],
    type: 'proposalAuthor'
  }),
  // This is for only the current reviewers
  proposalReviewer: () => ({
    id: PROPOSAL_REVIEWERS_BLOCK_ID,
    name: 'Reviewers',
    options: [],
    type: 'proposalReviewer'
  }),
  proposalEvaluationType: () => ({
    id: uuid(),
    name: 'Proposal Type',
    options: [],
    type: 'proposalEvaluationType'
  }),
  /* @deprecated - we should just use the normal created property */
  proposalCreatedAt: () => ({
    id: CREATED_AT_ID,
    name: 'Created Time',
    options: [],
    type: 'createdTime'
  })
};

export const EVALUATION_STATUS_VERB_LABELS: Record<ProposalEvaluationStatus, string> = {
  complete: 'Complete',
  declined: 'Decline',
  in_progress: 'In Progress',
  passed: 'Pass',
  published: 'Publish',
  unpublished: 'Unpublish',
  archived: 'Archive'
};

export const PROPOSAL_STEP_LABELS: Record<ProposalEvaluationStep, string> = {
  draft: 'Draft',
  feedback: 'Feedback',
  pass_fail: 'Review',
  rubric: 'Rubric',
  vote: 'Vote',
  rewards: 'Rewards',
  credentials: 'Credentials'
};

export const proposalStepBoardColors: Record<ProposalEvaluationStep, keyof (typeof Constants)['menuColors']> = {
  feedback: 'propColorGray',
  pass_fail: 'propColorGray',
  rubric: 'propColorGray',
  vote: 'propColorGray',
  draft: 'propColorGray',
  rewards: 'propColorGray',
  credentials: 'propColorGray'
};

export const PROPOSAL_RESULT_LABELS: Record<ProposalEvaluationResultExtended, string> = {
  in_progress: 'In Progress',
  fail: 'Failed',
  pass: 'Passed'
};
