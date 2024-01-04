import type { ProposalEvaluation, ProposalStatus } from '@charmverse/core/prisma';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import type { ProposalEvaluationStatus } from './interface';

/**
 * find the first evaluation that does not have a result
 * */
export function getOldProposalStatus({
  evaluations,
  status
}: {
  status: ProposalStatus;
  evaluations: Pick<ProposalEvaluation, 'index' | 'result' | 'type'>[];
}): ProposalStatus {
  const currentEvaluation = getCurrentEvaluation(evaluations);

  if (status === 'draft') {
    return 'draft';
  } else if (currentEvaluation?.type === 'feedback') {
    return 'discussion';
  } else if (currentEvaluation?.type === 'vote') {
    return currentEvaluation.result ? 'vote_closed' : 'vote_active';
  } else if (currentEvaluation?.type === 'rubric') {
    return currentEvaluation.result ? 'evaluation_closed' : 'evaluation_active';
  } else if (currentEvaluation?.type === 'pass_fail') {
    return currentEvaluation.result ? 'reviewed' : 'evaluation_active'; // we doint have a review_active
  }
  return status;
}

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
    return 'unpublished';
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
    return 'passed';
  }

  return 'in_progress';
}
