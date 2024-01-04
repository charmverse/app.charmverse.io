import type { ProposalStatus } from '@charmverse/core/prisma';

import type { ProposalEvaluationStatus, ProposalEvaluationStep } from './interface';

export type ProposalStatusWithArchived = ProposalStatus | 'archived';

export const PROPOSAL_STATUS_LABELS: Record<ProposalEvaluationStatus, string> = {
  complete: 'Complete',
  declined: 'Declined',
  in_progress: 'In Progress',
  passed: 'Passed',
  published: 'Published',
  unpublished: 'Unpublished'
};

export const PROPOSAL_STEP_LABELS: Record<ProposalEvaluationStep, string> = {
  feedback: 'Feedback',
  pass_fail: 'Review',
  vote: 'Vote',
  rubric: 'Rubric',
  rewards: 'Rewards',
  draft: 'Draft'
};
