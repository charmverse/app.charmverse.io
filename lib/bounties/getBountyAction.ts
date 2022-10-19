import type { ApplicationStatus, BountyStatus } from '@prisma/client';

import type { BountyTask } from './getBountyTasks';

export function getBountyAction ({
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
  }
  else if (applicationStatus === 'inProgress' && isApplicant) {
    return 'application_approved';
  }
  else if (applicationStatus === 'rejected' && isApplicant) {
    return 'application_rejected';
  }
  else if (applicationStatus === 'review' && isReviewer) {
    return 'work_submitted';
  }
  else if (applicationStatus === 'complete' && isApplicant) {
    return 'work_approved';
  }
  else if (applicationStatus === 'complete' && isReviewer) {
    return 'payment_needed';
  }
  else if (applicationStatus === 'paid' && isApplicant) {
    return 'payment_complete';
  }
  else if (bountyStatus === 'suggestion' && isSpaceAdmin) {
    return 'suggested_bounty';
  }

  return null;
}
