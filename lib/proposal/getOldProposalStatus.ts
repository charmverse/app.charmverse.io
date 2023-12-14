import { getCurrentEvaluation } from '@charmverse/core/proposals';
import type { ProposalEvaluation, ProposalStatus } from '@prisma/client';
/**
 * find the first evalation that does not have a result
 *
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
  return 'published'; // this should never happen
}
