/* Any method here can be used across client and server */

import { BountyStatus } from '@prisma/client';
import { BountyWithDetails } from 'models';

export function requesterCanDeleteBounty ({ bounty, requesterIsAdmin, requesterCreatedBounty }: {
  bounty: BountyWithDetails,
  requesterIsAdmin: boolean,
  requesterCreatedBounty: boolean
}): boolean {

  if (requesterIsAdmin) {
    return true;
  }
  else if (requesterCreatedBounty && bounty.status === 'suggestion') {
    return true;
  // Make sure the non admin creator can delete the bounty only if there are no in progress valid submissions
  }
  else if (requesterCreatedBounty && bounty?.status === 'open' && bounty?.applications.filter(a => a.status !== 'applied'
  && a.status !== 'rejected').length === 0) {
    return true;
  }

  return false;
}

// Allow ability to lock submissions only if the bounty is in status to receive new submissions.
export function isBountyLockable (bounty: BountyWithDetails): boolean {
  const lockableStatuses: BountyStatus[] = ['open', 'inProgress'];

  return lockableStatuses.includes(bounty.status);
}
