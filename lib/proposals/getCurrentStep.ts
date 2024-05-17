import type { ProposalEvaluation, ProposalStatus } from '@charmverse/core/prisma-client';
import { ProposalEvaluationResult } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import type { ProposalEvaluationResultExtended, ProposalEvaluationStep } from './interfaces';

export type ProposalStep = {
  title: string;
  step: ProposalEvaluationStep;
  result: ProposalEvaluationResultExtended;
  id: string;
  index: number;
  requiredReviews: number;
  finalStep: boolean | null;
};

export function getCurrentStep({
  evaluations,
  proposalStatus,
  hasPendingRewards,
  credentialsEnabled,
  hasPublishedRewards,
  hasPendingCredentials
}: {
  proposalStatus: ProposalStatus;
  evaluations: Pick<
    ProposalEvaluation,
    'index' | 'result' | 'title' | 'type' | 'id' | 'requiredReviews' | 'finalStep'
  >[];
  hasPublishedRewards: boolean;
  hasPendingRewards: boolean;
  credentialsEnabled: boolean;
  hasPendingCredentials: boolean;
}): ProposalStep {
  const hasRewards = hasPublishedRewards || hasPendingRewards;

  const currentEvaluation = getCurrentEvaluation(evaluations);

  const lastEvaluation =
    currentEvaluation && currentEvaluation.finalStep ? currentEvaluation : evaluations[evaluations.length - 1];

  if (proposalStatus === 'draft' || !currentEvaluation) {
    return getDraftStep();
  }

  const proposalEvaluationStepsCompleted =
    currentEvaluation.id === lastEvaluation?.id && lastEvaluation?.result === 'pass';

  if (proposalEvaluationStepsCompleted && (hasPendingCredentials || (credentialsEnabled && !hasRewards))) {
    return {
      title: 'Credentials',
      step: 'credentials' as ProposalEvaluationStep,
      result: !hasPendingCredentials ? ProposalEvaluationResult.pass : 'in_progress',
      id: 'credentials',
      // Add 1 with total evaluations so that draft step is also included
      index: evaluations.length + 1,
      requiredReviews: 1,
      finalStep: null
    };
  }

  if (proposalEvaluationStepsCompleted && hasRewards) {
    return {
      title: 'Rewards',
      step: 'rewards' as ProposalEvaluationStep,
      result: hasPublishedRewards ? ProposalEvaluationResult.pass : 'in_progress',
      id: 'rewards',
      // Add 1 with total evaluations so that draft step is also included
      index: evaluations.length + (credentialsEnabled ? 2 : 1),
      requiredReviews: 1,
      finalStep: null
    };
  }

  return {
    title: currentEvaluation.title,
    step: currentEvaluation.type,
    result: currentEvaluation.result ?? 'in_progress',
    id: currentEvaluation.id,
    // Add 1 with total evaluations so that draft step is also included
    index: currentEvaluation.index + 1,
    requiredReviews: currentEvaluation.requiredReviews,
    finalStep: currentEvaluation.finalStep
  };
}

export function getDraftStep(): ProposalStep {
  return {
    title: 'Draft',
    step: 'draft' as ProposalEvaluationStep,
    result: 'in_progress',
    id: 'draft',
    index: 0,
    requiredReviews: 1,
    finalStep: null
  };
}
