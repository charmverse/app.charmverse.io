import type { ProposalEvaluation, ProposalStatus } from '@charmverse/core/prisma-client';
import { ProposalEvaluationResult } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import type { ProposalEvaluationResultExtended, ProposalEvaluationStep } from './interface';

export type ProposalStep = {
  title: string;
  step: ProposalEvaluationStep;
  result: ProposalEvaluationResultExtended;
  id: string;
};

export function getCurrentStep({
  evaluations,
  proposalStatus,
  hasPendingRewards,
  hasPublishedRewards
}: {
  proposalStatus: ProposalStatus;
  evaluations: Pick<ProposalEvaluation, 'index' | 'result' | 'title' | 'type' | 'id'>[];
  hasPublishedRewards: boolean;
  hasPendingRewards: boolean;
}): ProposalStep {
  const hasRewards = hasPublishedRewards || hasPendingRewards;

  const currentEvaluation = getCurrentEvaluation(evaluations);

  const lastEvaluation = evaluations[evaluations.length - 1];

  if (proposalStatus === 'draft' || !currentEvaluation) {
    return {
      title: 'Draft',
      step: 'draft' as ProposalEvaluationStep,
      result: 'in_progress',
      id: 'draft'
    };
  }

  if (currentEvaluation.id === lastEvaluation?.id && lastEvaluation?.result === 'pass' && hasRewards) {
    return {
      title: 'Rewards',
      step: 'rewards' as ProposalEvaluationStep,
      result: hasPublishedRewards ? ProposalEvaluationResult.pass : 'in_progress',
      id: 'rewards'
    };
  }

  return {
    title: currentEvaluation.title,
    step: currentEvaluation.type,
    result: currentEvaluation.result ?? 'in_progress',
    id: currentEvaluation.id
  };
}
