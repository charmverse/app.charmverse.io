import type { ProposalEvaluation } from '@charmverse/core/prisma';
import { sortBy } from 'lodash';
// find the first evaulation that does not have a result
export function getCurrentEvaluation<
  T extends Pick<ProposalEvaluation, 'index' | 'result'> = Pick<ProposalEvaluation, 'index' | 'result'>
>(evaluations: T[]) {
  return sortBy(evaluations, 'index').find((evaluation) => !evaluation.result);
}
