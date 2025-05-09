import type { Application, Bounty as Reward } from '@charmverse/core/prisma';

export function getRewardActor({
  reward,
  application,
  isApplicant,
  isReviewer,
  isSpaceAdmin
}: {
  reward: Reward;
  application: Application;
  isApplicant: boolean;
  isReviewer: boolean;
  isSpaceAdmin: boolean;
}) {
  const applicationStatus = application.status;

  if (reward.status === 'suggestion' && isSpaceAdmin) {
    return reward.createdBy;
  }

  if (isReviewer) {
    // user applied or submitted work
    if (['applied', 'review'].includes(applicationStatus)) {
      return application.createdBy;
    }
  }

  if (isApplicant && applicationStatus) {
    // user was accepted - show who accepted
    if (['inProgress', 'complete'].includes(applicationStatus)) {
      return application.acceptedBy;
    }

    // user was rejected - show who rejected
    if (applicationStatus === 'rejected') {
      return application.reviewedBy;
    }
  }

  // all other cases - we cannot determine who the actor is
  return null;
}
