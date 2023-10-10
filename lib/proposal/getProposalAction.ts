import type { ProposalStatus } from '@charmverse/core/prisma';

export type ProposalTaskAction =
  | 'reviewed'
  | 'needs_review'
  | 'start_discussion'
  | 'vote'
  | 'start_review'
  | 'evaluation_active'
  | 'evaluation_closed';

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
      return 'start_discussion';
    }
  } else if (currentStatus === 'reviewed') {
    if (isAuthor) {
      return 'reviewed';
    }
  } else if (currentStatus === 'vote_active' && notifyNewEvents) {
    return 'vote';
  } else if (currentStatus === 'review') {
    if (isReviewer) {
      return 'needs_review';
    }
  } else if (currentStatus === 'evaluation_active' && isReviewer) {
    return 'evaluation_active';
  } else if (currentStatus === 'evaluation_closed' && isAuthor) {
    return 'evaluation_closed';
  }
  return null;
}
