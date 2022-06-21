/* Any method here can be used across client and server */

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
