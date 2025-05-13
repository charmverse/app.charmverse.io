import type { Proposal, ProposalEvaluation } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import type { ProposalNotificationType } from '@packages/lib/notifications/interfaces';
import type { Reward } from '@packages/lib/rewards/interfaces';

export type ProposalWithEvaluation = Pick<Proposal, 'status'> & {
  evaluations: (Pick<ProposalEvaluation, 'index' | 'result' | 'type' | 'id'> & {
    finalStep?: boolean | null;
    appealedAt?: Date | null;
  })[];
  rewards: Pick<Reward, 'id'>[];
};

export function getProposalAction({
  isAuthor,
  isReviewer,
  isVoter,
  proposal,
  canComment
}: {
  proposal: ProposalWithEvaluation;
  isVoter: boolean;
  isAuthor: boolean;
  isReviewer: boolean;
  canComment: boolean;
}): ProposalNotificationType | null {
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  if (!currentEvaluation || proposal.status === 'draft') {
    return null;
  }

  if (
    (currentEvaluation.index === proposal.evaluations.length - 1 ||
      currentEvaluation.finalStep ||
      currentEvaluation.appealedAt) &&
    isAuthor
  ) {
    if (currentEvaluation.result === 'pass') {
      return proposal.rewards.length > 0 ? 'reward_published' : 'proposal_passed';
    } else if (currentEvaluation.result === 'fail') {
      return 'proposal_failed';
    }
  }

  if (currentEvaluation.type === 'feedback' && canComment) {
    return 'start_discussion';
  }

  if (currentEvaluation.type === 'vote') {
    if (currentEvaluation.result === null && isVoter) {
      return 'vote';
    }
  }

  const previousEvaluation = currentEvaluation.index > 0 ? proposal.evaluations[currentEvaluation.index - 1] : null;

  if (currentEvaluation.result === null && previousEvaluation && previousEvaluation.result === 'pass') {
    if (previousEvaluation.type === 'vote' && (isAuthor || isVoter)) {
      return 'vote_passed';
    }
    if (isAuthor) {
      return 'step_passed';
    }
  }

  if (currentEvaluation.type === 'pass_fail' || currentEvaluation.type === 'rubric') {
    if (currentEvaluation.result === null && isReviewer) {
      return 'review_required';
    }

    if (isAuthor && currentEvaluation.result === 'fail') {
      return 'proposal_failed';
    }
  }

  return null;
}
