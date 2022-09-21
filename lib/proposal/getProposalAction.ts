import type { ProposalStatus } from '@prisma/client';
import type { ProposalTask } from './getProposalTasks';

export function getProposalAction ({
  authors,
  currentStatus,
  reviewers,
  userId,
  userRoleIds
}: {
  currentStatus: ProposalStatus,
  authors: string[],
  reviewers: string[],
  userId: string,
  userRoleIds: string[]
}): ProposalTask['action'] | null {
  const isAuthor = authors.includes(userId);
  const isReviewer = reviewers.some(reviewer => userRoleIds.includes(reviewer) || reviewer === userId);

  if (currentStatus === 'discussion') {
    if (isAuthor) {
      return 'start_review';
    }
    return 'discuss';
  }
  else if (currentStatus === 'draft' || currentStatus === 'private_draft') {
    if (isAuthor) {
      return 'start_discussion';
    }
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
