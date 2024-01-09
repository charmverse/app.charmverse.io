import type { Proposal, ProposalEvaluation } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import type { ProposalNotificationType } from 'lib/notifications/interfaces';
import type { Reward } from 'lib/rewards/interfaces';

export type ProposalWithEvaluation = Pick<Proposal, 'status'> & {
  evaluations: Pick<ProposalEvaluation, 'index' | 'result' | 'type' | 'id'>[];
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
  const lastEvaluation = proposal.evaluations[proposal.evaluations.length - 1];
  const previousEvaluation =
    currentEvaluation?.index && currentEvaluation.index > 0 ? proposal.evaluations[currentEvaluation.index - 1] : null;

  if (!currentEvaluation || proposal.status === 'draft') {
    return null;
  }

  const hasRewards = proposal.rewards.length > 0;

  if (currentEvaluation.id === lastEvaluation.id && isAuthor) {
    if (currentEvaluation.result === 'pass') {
      return hasRewards ? 'reward_published' : 'proposal_passed';
    } else if (currentEvaluation.result === 'fail') {
      return 'proposal_failed';
    }
  }

  if (currentEvaluation.type === 'feedback' && canComment) {
    return 'start_discussion';
  }

  if (currentEvaluation.type === 'vote' && isVoter) {
    return currentEvaluation.result === 'pass'
      ? 'vote_passed'
      : currentEvaluation.result === 'fail'
      ? 'vote_failed'
      : 'vote';
  }

  if (currentEvaluation.type === 'pass_fail' || currentEvaluation.type === 'rubric') {
    if (currentEvaluation.result === null && isReviewer) {
      return 'review_required';
    }

    if (isAuthor && currentEvaluation.result === 'fail') {
      return 'proposal_failed';
    }
  }

  if (currentEvaluation.result === null && previousEvaluation) {
    if (isAuthor) {
      if (previousEvaluation.result === 'fail') {
        return previousEvaluation.type === 'vote' ? 'vote_failed' : 'proposal_failed';
      }
      return previousEvaluation.type === 'vote' ? 'vote_passed' : 'step_passed';
    } else if (isVoter && previousEvaluation.type === 'vote') {
      return previousEvaluation.result === 'pass' ? 'vote_passed' : 'vote_failed';
    }
  }

  return null;
}
