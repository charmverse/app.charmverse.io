import type { Application, ApplicationStatus, Bounty, BountyNotification, BountyStatus } from '@charmverse/core/prisma';

import type { BountyNotificationType } from 'lib/notifications/interfaces';

export const BountyActionConversionRecord: Record<BountyNotificationType, string> = {
  'application.pending': 'application_pending',
  'application.accepted': 'application_approved',
  'application.rejected': 'application_rejected',
  'application.submitted': 'work_submitted',
  'application.approved': 'work_approved',
  'application.payment_pending': 'payment_needed',
  'application.payment_completed': 'payment_complete',
  'suggestion.created': 'suggested_bounty',
  'inline_comment.created': 'inline_comment.created',
  'inline_comment.mention.created': 'inline_comment.mention.created',
  'inline_comment.replied': 'inline_comment.replied',
  'mention.created': 'mention.created'
};

export function convertBountyAction(type: BountyNotificationType) {}

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
}): BountyNotificationType | null {
  if (applicationStatus === 'applied' && isReviewer) {
    return 'application.pending';
  } else if (applicationStatus === 'inProgress' && isApplicant) {
    return 'application.accepted';
  } else if (applicationStatus === 'rejected' && isApplicant) {
    return 'application.rejected';
  } else if (applicationStatus === 'review' && isReviewer) {
    return 'application.submitted';
  } else if (applicationStatus === 'complete' && isApplicant) {
    return 'application.approved';
  } else if (applicationStatus === 'complete' && isReviewer) {
    return 'application.payment_pending';
  } else if (applicationStatus === 'paid' && isApplicant) {
    return 'application.payment_completed';
  } else if (bountyStatus === 'suggestion' && isSpaceAdmin) {
    return 'suggestion.created';
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
