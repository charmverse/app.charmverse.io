import { BountyPermissionLevel, BountyOperation } from '@prisma/client';
import { OperationGroupMapping } from '../interfaces';

export function bountyPermissionLevels () {
  return Object.keys(BountyPermissionLevel) as BountyPermissionLevel[];
}

class BountyPermissionLevelOperationMapping implements OperationGroupMapping<BountyPermissionLevel, BountyOperation> {

  readonly creator: Readonly<BountyOperation[]>;

  readonly reviewer: Readonly<BountyOperation[]>;

  readonly submitter: Readonly<BountyOperation[]>;

  readonly viewer: Readonly<BountyOperation[]>;

  constructor () {
    this.creator = ['view', 'edit', 'delete', 'lock', 'approve_applications'];
    this.reviewer = ['review', 'view', 'approve_applications'];
    this.submitter = ['view', 'work'];
    this.viewer = ['view'];
  }
}

export const bountyPermissionMapping = new BountyPermissionLevelOperationMapping();

