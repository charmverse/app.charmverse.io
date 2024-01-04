import type { ProposalEvaluation, ProposalStatus } from '@charmverse/core/prisma';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import type { ProposalEvaluationStatus } from './interface';

export function getProposalEvaluationStatus({
  evaluations,
  status,
  hasPendingRewards,
  hasRewards
}: {
  hasRewards: boolean;
  hasPendingRewards: boolean;
  status: ProposalStatus;
  evaluations: Pick<ProposalEvaluation, 'index' | 'result' | 'type'>[];
}): ProposalEvaluationStatus {
  const currentEvaluation = getCurrentEvaluation(evaluations);
  const isLastEvaluation = currentEvaluation?.index === evaluations.length - 1;
  if (status === 'draft' || !currentEvaluation) {
    return 'in_progress';
  }

  const currentEvaluationResult = currentEvaluation.result;

  if (currentEvaluation.type === 'feedback') {
    return currentEvaluationResult === null ? 'in_progress' : 'complete';
  } else if (
    currentEvaluation.type === 'pass_fail' ||
    currentEvaluation.type === 'rubric' ||
    currentEvaluation.type === 'vote'
  ) {
    if (currentEvaluationResult === null) {
      return 'in_progress';
    } else if (currentEvaluationResult === 'fail') {
      return 'declined';
    } else if (isLastEvaluation) {
      if (hasRewards) {
        return 'published';
      } else if (hasPendingRewards) {
        return 'unpublished';
      }
      return 'passed';
    }
  }

  return 'in_progress';
}
