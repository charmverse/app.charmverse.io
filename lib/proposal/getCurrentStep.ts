import type { ProposalEvaluation, ProposalStatus } from '@charmverse/core/prisma-client';
import { ProposalEvaluationResult } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import type { ProposalEvaluationStep } from './interface';

export type ProposalStep = {
  title: string;
  step: ProposalEvaluationStep;
  result: ProposalEvaluationResult | null;
};

export function getCurrentStep({
  evaluations,
  proposalStatus,
  hasPendingRewards,
  hasPublishedRewards
}: {
  proposalStatus: ProposalStatus;
  evaluations: Pick<ProposalEvaluation, 'index' | 'result' | 'title' | 'type'>[];
  hasPublishedRewards: boolean;
  hasPendingRewards: boolean;
}): ProposalStep {
  const hasRewards = hasPublishedRewards || hasPendingRewards;

  const currentEvaluation = getCurrentEvaluation(evaluations);
  return proposalStatus === 'draft'
    ? {
        title: 'Draft',
        step: 'draft' as ProposalEvaluationStep,
        result: null
      }
    : currentEvaluation && !hasRewards
    ? {
        title: currentEvaluation.title,
        step: currentEvaluation.type,
        result: currentEvaluation.result
      }
    : {
        title: 'Rewards',
        step: 'rewards' as ProposalEvaluationStep,
        result: hasPublishedRewards ? ProposalEvaluationResult.pass : null
      };
}
