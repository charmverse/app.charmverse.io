import type {
  Application,
  ApplicationStatus,
  Bounty as Reward,
  BountyStatus as RewardStatus
} from '@charmverse/core/prisma';

import type { RewardTask } from './getRewardTasks';

export function getRewardAction({
  isSpaceAdmin,
  rewardStatus,
  applicationStatus,
  isApplicant,
  isReviewer
}: {
  isSpaceAdmin: boolean;
  rewardStatus: RewardStatus;
  applicationStatus?: ApplicationStatus;
  isApplicant: boolean;
  isReviewer: boolean;
}): RewardTask['action'] | null {
  if (applicationStatus === 'applied' && isReviewer) {
    return 'application_pending';
  } else if (applicationStatus === 'inProgress' && isApplicant) {
    return 'application_approved';
  } else if (applicationStatus === 'rejected' && isApplicant) {
    return 'application_rejected';
  } else if (applicationStatus === 'review' && isReviewer) {
    return 'work_submitted';
  } else if (applicationStatus === 'complete' && isApplicant) {
    return 'work_approved';
  } else if (applicationStatus === 'complete' && isReviewer) {
    return 'payment_needed';
  } else if (applicationStatus === 'paid' && isApplicant) {
    return 'payment_complete';
  } else if (rewardStatus === 'suggestion' && isSpaceAdmin) {
    return 'suggested_reward';
  }

  return null;
}

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
