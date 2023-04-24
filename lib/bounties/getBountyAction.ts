import type { Application, ApplicationStatus, Bounty, BountyStatus } from '@charmverse/core/dist/prisma';

import type { BountyTask } from './getBountyTasks';

export function getBountyAction({
  isSpaceAdmin,
  bountyStatus,
  applicationStatus,
  isApplicant,
  isReviewer
}: {
  isSpaceAdmin: boolean;
  bountyStatus: BountyStatus;
  applicationStatus?: ApplicationStatus;
  isApplicant: boolean;
  isReviewer: boolean;
}): BountyTask['action'] | null {
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
  } else if (bountyStatus === 'suggestion' && isSpaceAdmin) {
    return 'suggested_bounty';
  }

  return null;
}

export function getBountyActor({
  bounty,
  application,
  isApplicant,
  isReviewer,
  isSpaceAdmin
}: {
  bounty: Bounty;
  application: Application;
  isApplicant: boolean;
  isReviewer: boolean;
  isSpaceAdmin: boolean;
}) {
  const applicationStatus = application.status;

  if (bounty.status === 'suggestion' && isSpaceAdmin) {
    return bounty.createdBy;
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
