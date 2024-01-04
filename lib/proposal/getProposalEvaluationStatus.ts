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
  const currentStep = getCurrentEvaluation(evaluations);

  if (status === 'draft') {
    return 'draft';
  } else if (currentStep?.type === 'feedback') {
    return 'discussion';
  } else if (currentStep?.type === 'vote') {
    return currentStep.result ? 'vote_closed' : 'vote_active';
  } else if (currentStep?.type === 'rubric') {
    return currentStep.result ? 'evaluation_closed' : 'evaluation_active';
  } else if (currentStep?.type === 'pass_fail') {
    return currentStep.result ? 'reviewed' : 'evaluation_active'; // we doint have a review_active
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
  const currentStep = getCurrentEvaluation(evaluations);
  const isLastEvaluation = currentStep?.index === evaluations.length - 1;
  if (status === 'draft' || !currentStep) {
    return 'unpublished';
  }

  const currentEvaluationResult = currentStep.result;

  if (currentStep.type === 'feedback') {
    return currentEvaluationResult === null ? 'in_progress' : 'complete';
  } else if (currentStep.type === 'pass_fail' || currentStep.type === 'rubric' || currentStep.type === 'vote') {
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
