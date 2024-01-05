import type { ProposalEvaluation, ProposalStatus } from '@charmverse/core/prisma';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import type { ProposalStep } from './getCurrentStep';
import type { ProposalEvaluationResultExtended, ProposalEvaluationStatus, ProposalEvaluationStep } from './interface';

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
  step,
  result
}: {
  step: ProposalEvaluationStep;
  result: ProposalEvaluationResultExtended;
}): ProposalEvaluationStatus {
  if (step === 'draft') {
    return 'unpublished';
  } else if (step === 'feedback') {
    return result === null ? 'in_progress' : 'complete';
  } else if (step === 'pass_fail' || step === 'rubric' || step === 'vote') {
    if (result === null) {
      return 'in_progress';
    } else if (result === 'fail') {
      return 'declined';
    } else if (result === 'pass') {
      return 'passed';
    }
  } else if (step === 'rewards') {
    return result === null ? 'unpublished' : 'published';
  }

  return 'in_progress';
}
