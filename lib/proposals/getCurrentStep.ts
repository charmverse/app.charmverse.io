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
};

export function getCurrentStep({
  evaluations,
  proposalStatus,
  hasPendingRewards,
  credentialsEnabled,
  hasPublishedRewards,
  hasPendingOnchainCredentials
}: {
  proposalStatus: ProposalStatus;
  evaluations: Pick<ProposalEvaluation, 'index' | 'result' | 'title' | 'type' | 'id'>[];
  hasPublishedRewards: boolean;
  hasPendingRewards: boolean;
  credentialsEnabled?: boolean;
  hasPendingOnchainCredentials?: boolean;
}): ProposalStep {
  const hasRewards = hasPublishedRewards || hasPendingRewards;

  const currentEvaluation = getCurrentEvaluation(evaluations);

  const lastEvaluation = evaluations[evaluations.length - 1];

  if (proposalStatus === 'draft' || !currentEvaluation) {
    return getDraftStep();
  }

  const proposalEvaluationStepsCompleted =
    currentEvaluation.id === lastEvaluation?.id && lastEvaluation?.result === 'pass';

  if (proposalEvaluationStepsCompleted && (hasPendingOnchainCredentials || (credentialsEnabled && !hasRewards))) {
    return {
      title: 'Credentials',
      step: 'credentials' as ProposalEvaluationStep,
      result: !hasPendingOnchainCredentials ? ProposalEvaluationResult.pass : 'in_progress',
      id: 'credentials',
      // Add 1 with total evaluations so that draft step is also included
      index: evaluations.length + 1
    };
  }

  if (proposalEvaluationStepsCompleted && hasRewards) {
    return {
      title: 'Rewards',
      step: 'rewards' as ProposalEvaluationStep,
      result: hasPublishedRewards ? ProposalEvaluationResult.pass : 'in_progress',
      id: 'rewards',
      // Add 1 with total evaluations so that draft step is also included
      index: evaluations.length + (credentialsEnabled ? 2 : 1)
    };
  }

  return {
    title: currentEvaluation.title,
    step: currentEvaluation.type,
    result: currentEvaluation.result ?? 'in_progress',
    id: currentEvaluation.id,
    // Add 1 with total evaluations so that draft step is also included
    index: currentEvaluation.index + 1
  };
}

export function getDraftStep(): ProposalStep {
  return {
    title: 'Draft',
    step: 'draft' as ProposalEvaluationStep,
    result: 'in_progress',
    id: 'draft',
    index: 0
  };
}
