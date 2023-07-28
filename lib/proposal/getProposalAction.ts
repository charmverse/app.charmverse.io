import type { ProposalStatus } from '@charmverse/core/prisma';

export type ProposalTaskAction = 'start_discussion' | 'start_vote' | 'review' | 'discuss' | 'vote' | 'start_review';

export function getProposalAction({
  isAuthor,
  currentStatus,
  isReviewer,
  notifyNewEvents
}: {
  currentStatus: ProposalStatus;
  isAuthor: boolean;
  isReviewer: boolean;
  notifyNewEvents: boolean;
}): ProposalTaskAction | null {
  if (currentStatus === 'discussion') {
    if (isAuthor) {
      return 'start_review';
    }
    if (notifyNewEvents) {
      return 'discuss';
    }
  } else if (currentStatus === 'reviewed') {
    if (isAuthor) {
      return 'start_vote';
    }
  } else if (currentStatus === 'vote_active' && notifyNewEvents) {
    return 'vote';
  } else if (currentStatus === 'review') {
    if (isReviewer) {
      return 'review';
    }
  }
  return null;
}
