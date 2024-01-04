import type { ProposalEvaluation, ProposalStatus } from '@charmverse/core/prisma';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import type { ProposalStep } from './getCurrentStep';
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
  proposalStep
}: {
  proposalStep: ProposalStep;
}): ProposalEvaluationStatus {
  if (proposalStep.step === 'draft') {
    return 'unpublished';
  } else if (proposalStep.step === 'feedback') {
    return proposalStep.result === null ? 'in_progress' : 'complete';
  } else if (proposalStep.step === 'pass_fail' || proposalStep.step === 'rubric' || proposalStep.step === 'vote') {
    if (proposalStep.result === null) {
      return 'in_progress';
    } else if (proposalStep.result === 'fail') {
      return 'declined';
    } else if (proposalStep.result === 'pass') {
      return 'passed';
    }
  } else if (proposalStep.step === 'rewards') {
    return proposalStep.result === null ? 'unpublished' : 'published';
  }

  return 'in_progress';
}
