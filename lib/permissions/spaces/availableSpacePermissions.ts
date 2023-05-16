import { SpaceOperation } from '@charmverse/core/prisma';

import { BasePermissions } from '../basePermissions.class';

export class AvailableSpacePermissions extends BasePermissions<SpaceOperation> {
  constructor(operations: SpaceOperation[] = []) {
    super({ allowedOperations: Object.keys(SpaceOperation) as SpaceOperation[] });

    this.addPermissions(operations);
  }
}
