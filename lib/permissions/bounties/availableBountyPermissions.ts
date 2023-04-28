import { BountyOperation } from '@charmverse/core/dist/prisma';

import { BasePermissions } from '../basePermissions.class';

export class AvailableBountyPermissions extends BasePermissions<BountyOperation> {
  constructor(operations: BountyOperation[] = []) {
    super({ allowedOperations: Object.keys(BountyOperation) as BountyOperation[] });

    this.addPermissions(operations);
  }
}
