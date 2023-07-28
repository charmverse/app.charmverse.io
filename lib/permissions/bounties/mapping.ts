import type { BountyOperation } from '@charmverse/core/prisma';
import { BountyPermissionLevel } from '@charmverse/core/prisma';

import type { OperationGroupMapping } from '../interfaces';

export function bountyPermissionLevels() {
  return Object.keys(BountyPermissionLevel) as BountyPermissionLevel[];
}

class BountyPermissionLevelOperationMapping implements OperationGroupMapping<BountyPermissionLevel, BountyOperation> {
  readonly creator: Readonly<BountyOperation[]>;

  readonly reviewer: Readonly<BountyOperation[]>;

  readonly submitter: Readonly<BountyOperation[]>;

  constructor() {
    this.creator = ['lock', 'approve_applications', 'grant_permissions', 'review', 'mark_paid'];
    this.reviewer = ['review', 'approve_applications'];
    this.submitter = ['work'];
  }
}

export const bountyPermissionMapping = new BountyPermissionLevelOperationMapping();

/**
 * Returns only the permission levels as strings which have access to the full set of operations
 */
export function getGroupsWithOperations(operations: BountyOperation[]): BountyPermissionLevel[] {
  return bountyPermissionLevels().filter((level) => {
    for (const op of operations) {
      if (!bountyPermissionMapping[level].includes(op)) {
        return false;
      }
    }

    return true;
  });
}
