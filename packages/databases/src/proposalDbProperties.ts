import { objectUtils } from '@packages/core/utilities';
import {
  AUTHORS_BLOCK_ID,
  CREATED_AT_ID,
  PROPOSAL_EVALUATION_DUE_DATE_ID,
  PROPOSAL_PUBLISHED_AT_ID,
  PROPOSAL_REVIEWERS_BLOCK_ID,
  PROPOSAL_STATUS_BLOCK_ID,
  PROPOSAL_STEP_BLOCK_ID
} from '@packages/lib/proposals/blocks/constants';
import type {
  ProposalEvaluationResultExtended,
  ProposalEvaluationStatus,
  ProposalEvaluationStep
} from '@packages/lib/proposals/interfaces';
import { v4 as uuid } from 'uuid';

import type { IPropertyTemplate, ProposalPropertyType } from './board';
import type { Constants } from './constants';

export const EVALUATION_STATUS_LABELS: Record<ProposalEvaluationStatus, string> = {
  declined: 'Declined',
  in_progress: 'In Progress',
  passed: 'Passed',
  unpublished: 'Unpublished',
  not_issued: 'Not Issued',
  draft: 'Draft',
  archived: 'Archived',
  issued: 'Issued',
  published: 'Published'
};

export const proposalStatusColors: Record<ProposalEvaluationStatus, string> = {
  declined: 'red',
  in_progress: 'yellow',
  passed: 'green',
  unpublished: 'gray',
  archived: 'gray',
  draft: 'gray',
  not_issued: 'gray',
  issued: 'green',
  published: 'green'
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
  proposalEvaluationReviewerAverage: () => ({
    id: uuid(),
    name: 'Proposal Evaluation Reviewer Average',
    options: [],
    type: 'proposalEvaluationReviewerAverage'
  }),
  proposalEvaluationTotal: () => ({
    id: uuid(),
    name: 'Proposal Evaluation Total',
    options: [],
    type: 'proposalEvaluationTotal'
  }),
  proposalRubricCriteriaTotal: () => ({
    id: uuid(),
    name: 'Proposal Rubric Criteria Total',
    options: [],
    type: 'proposalRubricCriteriaTotal'
  }),
  proposalRubricCriteriaAverage: () => ({
    id: uuid(),
    name: 'Proposal Rubric Criteria Average',
    options: [],
    type: 'proposalRubricCriteriaAverage'
  }),
  proposalAuthor: ({ name } = {}) => ({
    id: AUTHORS_BLOCK_ID,
    name: name || 'Proposal Authors',
    options: [],
    type: 'proposalAuthor'
  }),
  proposalEvaluationDueDate: () => ({
    id: PROPOSAL_EVALUATION_DUE_DATE_ID,
    name: 'Due Date',
    options: [],
    type: 'proposalEvaluationDueDate'
  }),
  proposalPublishedAt: ({ name } = {}) => ({
    id: PROPOSAL_PUBLISHED_AT_ID,
    name: name || 'Publish Date',
    options: [],
    type: 'proposalPublishedAt'
  }),
  proposalRubricCriteriaReviewerComment: () => ({
    id: uuid(),
    name: 'Proposal Rubric Criteria Reviewer Comment',
    options: [],
    type: 'proposalRubricCriteriaReviewerComment'
  }),
  proposalRubricCriteriaReviewerScore: () => ({
    id: uuid(),
    name: 'Proposal Rubric Criteria Reviewer Score',
    options: [],
    type: 'proposalRubricCriteriaReviewerScore'
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
  declined: 'Decline',
  in_progress: 'In Progress',
  passed: 'Pass',
  unpublished: 'Unpublish',
  archived: 'Archive',
  draft: 'Draft',
  not_issued: 'Not Issue',
  issued: 'Issue',
  published: 'Publish'
};

export const PROPOSAL_STEP_LABELS: Record<ProposalEvaluationStep, string> = {
  draft: 'Draft',
  feedback: 'Feedback',
  pass_fail: 'Review',
  rubric: 'Rubric',
  vote: 'Vote',
  rewards: 'Rewards',
  credentials: 'Credentials',
  sign_documents: 'Sign Documents'
};

export const proposalStepBoardColors: Record<ProposalEvaluationStep, keyof (typeof Constants)['menuColors']> = {
  feedback: 'propColorGray',
  pass_fail: 'propColorGray',
  rubric: 'propColorGray',
  vote: 'propColorGray',
  draft: 'propColorGray',
  rewards: 'propColorGray',
  credentials: 'propColorGray',
  sign_documents: 'propColorGray'
};

export const PROPOSAL_RESULT_LABELS: Record<ProposalEvaluationResultExtended, string> = {
  in_progress: 'In Progress',
  fail: 'Failed',
  pass: 'Passed'
};

export const defaultProposalProperties = [
  proposalDbProperties.proposalReviewerNotes(),
  proposalDbProperties.proposalStatus(),
  proposalDbProperties.proposalStep(),
  proposalDbProperties.proposalUrl(),
  proposalDbProperties.proposalAuthor(),
  proposalDbProperties.proposalReviewer(),
  proposalDbProperties.proposalPublishedAt(),
  proposalDbProperties.proposalEvaluationDueDate()
];

export const defaultProposalPropertyTypes = defaultProposalProperties.map((p) => p.type);
