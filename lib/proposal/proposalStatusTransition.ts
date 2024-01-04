import type { ProposalStatus } from '@charmverse/core/prisma';

import type { ProposalEvaluationStep } from './interface';

export type ProposalStatusWithArchived = ProposalStatus | 'archived';

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: 'Draft',
  discussion: 'Feedback',
  review: 'In Review',
  reviewed: 'Reviewed',
  vote_active: 'Vote Active',
  vote_closed: 'Vote Closed',
  evaluation_active: 'Evaluation Active',
  evaluation_closed: 'Evaluation Closed',
  published: 'Evaluation in progress'
};

export const PROPOSAL_STEP_LABELS: Record<ProposalEvaluationStep, string> = {
  feedback: 'Feedback',
  pass_fail: 'Review',
  vote: 'Vote',
  rubric: 'Rubric',
  rewards: 'Rewards',
  draft: 'Draft'
};

export const PROPOSAL_STATUS_LABELS_WITH_ARCHIVED: Record<ProposalStatusWithArchived, string> = {
  ...PROPOSAL_STATUS_LABELS,
  archived: 'Archived'
};
