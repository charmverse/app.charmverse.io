import type { ProposalStatus } from '@prisma/client';

import type { ProposalTask } from './getProposalTasks';

export function getProposalAction ({
  isAuthor,
  currentStatus,
  isReviewer
}: {
  currentStatus: ProposalStatus;
  isAuthor: boolean;
  isReviewer: boolean;
}): ProposalTask['action'] | null {

  if (currentStatus === 'discussion') {
    if (isAuthor) {
      return 'start_review';
    }
    return 'discuss';
  }
  else if (currentStatus === 'reviewed') {
    if (isAuthor) {
      return 'start_vote';
    }
  }
  else if (currentStatus === 'vote_active') {
    return 'vote';
  }
  else if (currentStatus === 'review') {
    if (isReviewer) {
      return 'review';
    }
  }
  return null;
}
