import { SpaceOperation } from '@prisma/client';

import type { UserPermissionFlags } from '../interfaces';
import { Permissions } from '../permissions.class';

export class AvailableSpacePermissions extends Permissions<SpaceOperation> implements UserPermissionFlags<SpaceOperation> {

  createPage: boolean = false;

  createBounty: boolean = false;

  createVote: boolean = false;

  constructor (operations: SpaceOperation[] = []) {
    super({ allowedOperations: Object.keys(SpaceOperation) as SpaceOperation[] });

    this.addPermissions(operations);
  }
}
