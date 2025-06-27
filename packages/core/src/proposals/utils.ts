import type { ProposalEvaluation, ProposalEvaluationType } from '@charmverse/core/prisma-client';

import { sortBy } from '../utilities/array';

/**
 * find the first evalation that does not have a result
 *
 * */
export function getCurrentEvaluation<
  T extends Pick<ProposalEvaluation, 'index' | 'result'> & {
    finalStep?: boolean | null;
    appealedAt?: Date | null;
  } = Pick<ProposalEvaluation, 'index' | 'result'> & {
    finalStep?: boolean | null;
    appealedAt?: Date | null;
  }
>(evaluations: T[]): T | undefined {
  const sortedEvaluations = sortBy(evaluations, 'index');
  const currentEvaluation = sortedEvaluations.find(
    (evaluation) =>
      (!evaluation.finalStep && evaluation.result === 'fail') ||
      (evaluation.finalStep && evaluation.result === 'pass') ||
      (evaluation.appealedAt && evaluation.result) ||
      !evaluation.result
  );

  return currentEvaluation ?? sortedEvaluations[sortedEvaluations.length - 1];
}

export const privateEvaluationSteps: ProposalEvaluationType[] = ['rubric', 'pass_fail', 'vote'];
