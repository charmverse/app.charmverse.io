import type { Application, Bounty } from '@charmverse/core/prisma';

import type { BountyNotificationType } from 'lib/notifications/interfaces';

export function convertBountyAction(type: BountyNotificationType) {}

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
