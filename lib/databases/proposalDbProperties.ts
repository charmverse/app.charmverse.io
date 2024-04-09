import { v4 as uuid } from 'uuid';

import type { ProposalPropertyType, IPropertyTemplate } from 'lib/databases/board';
import type { Constants } from 'lib/databases/constants';
import type {
  ProposalEvaluationResultExtended,
  ProposalEvaluationStatus,
  ProposalEvaluationStep
} from 'lib/proposals/interfaces';
import type { BrandColor } from 'theme/colors';

export const proposalDbProperties: {
  [key in ProposalPropertyType]: (id?: string, name?: string) => IPropertyTemplate;
} = {
  proposalReviewerNotes: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Reviewer Notes',
    options: [],
    type: 'proposalReviewerNotes'
  }),
  proposalStatus: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Status',
    options: [],
    type: 'proposalStatus'
  }),
  proposalStep: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Step',
    options: [],
    type: 'proposalStep'
  }),
  proposalUrl: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Url',
    options: [],
    type: 'proposalUrl'
  }),
  proposalEvaluatedBy: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Evaluated By',
    options: [],
    type: 'proposalEvaluatedBy'
  }),
  proposalEvaluationAverage: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Evaluation Average',
    options: [],
    type: 'proposalEvaluationAverage'
  }),
  proposalEvaluationTotal: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Evaluation Total',
    options: [],
    type: 'proposalEvaluationTotal'
  }),
  proposalAuthor: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Authors',
    options: [],
    type: 'proposalAuthor'
  }),
  proposalReviewer: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Reviewers',
    options: [],
    type: 'proposalReviewer'
  }),
  proposalEvaluationType: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Proposal Type',
    options: [],
    type: 'proposalEvaluationType'
  }),
  proposalCreatedAt: (id?: string, name?: string) => ({
    id: id || uuid(),
    name: name || 'Created Time',
    options: [],
    type: 'createdTime'
  })
};

export const EVALUATION_STATUS_LABELS: Record<ProposalEvaluationStatus, string> = {
  complete: 'Complete',
  declined: 'Declined',
  in_progress: 'In Progress',
  passed: 'Passed',
  published: 'Published',
  unpublished: 'Unpublished',
  archived: 'Archived'
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
  rewards: 'Rewards'
};

export const proposalStepBoardColors: Record<ProposalEvaluationStep, keyof (typeof Constants)['menuColors']> = {
  feedback: 'propColorGray',
  pass_fail: 'propColorGray',
  rubric: 'propColorGray',
  vote: 'propColorGray',
  draft: 'propColorGray',
  rewards: 'propColorGray'
};

export const PROPOSAL_RESULT_LABELS: Record<ProposalEvaluationResultExtended, string> = {
  in_progress: 'In Progress',
  fail: 'Failed',
  pass: 'Passed'
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
