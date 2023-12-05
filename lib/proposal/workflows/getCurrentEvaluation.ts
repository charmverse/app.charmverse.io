import type { ProposalEvaluation } from '@charmverse/core/prisma';
import { sortBy } from 'lodash';
// find the first evaulation that does not have a result
export function getCurrentEvaluation(evaluations: Pick<ProposalEvaluation, 'index' | 'result'>[]) {
  return sortBy(evaluations, 'index').find((evaluation) => !evaluation.result);
}
