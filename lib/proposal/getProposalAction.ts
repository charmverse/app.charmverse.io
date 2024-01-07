import type { Proposal, ProposalEvaluation } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import type { ProposalNotificationType } from 'lib/notifications/interfaces';
import type { Reward } from 'lib/rewards/interfaces';

import type { ProposalFields } from './interface';

export function getProposalAction({
  isAuthor,
  isReviewer,
  isVoter,
  proposal,
  canComment
}: {
  proposal: Pick<Proposal, 'status' | 'fields'> & {
    evaluations: ProposalEvaluation[];
    rewards: Pick<Reward, 'id'>[];
  };
  isVoter: boolean;
  isAuthor: boolean;
  isReviewer: boolean;
  canComment: boolean;
}): ProposalNotificationType | null {
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const lastEvaluation = proposal.evaluations[proposal.evaluations.length - 1];
  const previousEvaluation =
    currentEvaluation?.index && currentEvaluation.index > 0 && currentEvaluation.id !== lastEvaluation.id
      ? proposal.evaluations[currentEvaluation.index - 1]
      : null;

  if (!currentEvaluation || proposal.status === 'draft') {
    return null;
  }

  const hasRewards =
    ((proposal.fields as ProposalFields)?.pendingRewards ?? []).length > 0 || proposal.rewards.length > 0;

  const isPreviousStepReviewable = previousEvaluation?.type === 'pass_fail' || previousEvaluation?.type === 'rubric';
  const isCurrentStepReviewable = currentEvaluation.type === 'pass_fail' || currentEvaluation.type === 'rubric';

  if (isPreviousStepReviewable) {
    if (isAuthor && previousEvaluation.result === 'pass') {
      return 'step_passed';
    }
  }

  if (currentEvaluation.type === 'feedback') {
    return canComment ? 'start_discussion' : null;
  }

  if (currentEvaluation.type === 'vote') {
    if (currentEvaluation.result === 'pass' && (isAuthor || isVoter)) {
      return 'vote_closed';
    }
    return currentEvaluation.result === null && isVoter ? 'vote' : null;
  }

  // Passed last evaluation
  if (currentEvaluation.id === lastEvaluation.id && currentEvaluation.result === 'pass') {
    return isAuthor ? (hasRewards ? 'reward_published' : 'proposal_passed') : null;
  }

  if (isCurrentStepReviewable) {
    if (currentEvaluation.result === null && isReviewer) {
      return 'review_required';
    }

    if (isAuthor) {
      return currentEvaluation.result === 'fail' ? 'step_failed' : 'step_passed';
    }
  }

  return null;
}
