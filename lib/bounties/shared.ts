/* Any method here can be used across client and server */
import type { BountyStatus, Prisma } from '@prisma/client';

import type { BountyWithDetails, BountyPagePermissionSetRequest } from 'lib/bounties';
import { isTruthy } from 'lib/utilities/types';

export function requesterCanDeleteBounty ({ bounty, requesterIsAdmin, requesterCreatedBounty }: {
  bounty: BountyWithDetails;
  requesterIsAdmin: boolean;
  requesterCreatedBounty: boolean;
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

export function getBountyPagePermissionSet (model: BountyPagePermissionSetRequest): Omit<Prisma.PagePermissionCreateManyInput, 'pageId'>[] {

  const { createdBy, status, spaceId, permissions, linkedPageId } = model;
  const bountyPagePermissionSet: Omit<Prisma.PagePermissionCreateManyInput, 'pageId'>[] = [];

  bountyPagePermissionSet.push({
    permissionLevel: 'full_access',
    userId: createdBy
  });

  // Initialise page permissions
  if (status === 'suggestion') {
    bountyPagePermissionSet.push({
      permissionLevel: 'view',
      spaceId
    });
  }
  else {
    // Reviewer permissions
    permissions?.reviewer?.forEach(reviewer => {
      if (reviewer.group === 'role') {
        bountyPagePermissionSet.push({
          permissionLevel: 'view_comment',
          roleId: reviewer.id
        });
      }
      // Prevent adding a duplicate user permission for the creator
      else if (reviewer.group === 'user' && bountyPagePermissionSet.every(p => p.userId !== reviewer.id)) {
        bountyPagePermissionSet.push({
          permissionLevel: 'view_comment',
          userId: reviewer.id
        });
      }
    });

    // Submitter permissions
    permissions?.submitter?.forEach(submitter => {
      // Prevent adding a duplicate role permission
      if (submitter.group === 'role' && bountyPagePermissionSet.every(p => p.roleId !== submitter.id)) {
        bountyPagePermissionSet.push({
          permissionLevel: 'view',
          roleId: submitter.id
        });
      }
      // Prevent adding a duplicate space permission
      else if (submitter.group === 'space'
        && bountyPagePermissionSet.every(p => !isTruthy(p.spaceId))
        && !linkedPageId // if there already is a page, there is already a permission for <spaceId, pageId>
      ) {
        bountyPagePermissionSet.push({
          permissionLevel: 'view',
          spaceId
        });
      }
    });
  }

  return bountyPagePermissionSet;
}
