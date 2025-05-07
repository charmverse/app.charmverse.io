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
    this.creator = ['lock', 'approve_applications', 'grant_permissions', 'review', 'mark_paid', 'work'];
    this.reviewer = ['review', 'approve_applications'];
    this.submitter = ['work'];
  }
}

export const bountyPermissionMapping = new BountyPermissionLevelOperationMapping();
