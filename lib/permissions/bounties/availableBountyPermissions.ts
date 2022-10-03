import { BountyOperation } from '@prisma/client';

import { Permissions } from '../permissions.class';

import type { BountyPermissionFlags } from './interfaces';

export class AvailableBountyPermissions extends Permissions<BountyOperation> implements BountyPermissionFlags {

  grant_permissions: boolean = false;

  work: boolean = false;

  review: boolean = false;

  view: boolean = false;

  edit: boolean = false;

  delete: boolean = false;

  lock: boolean = false;

  approve_applications: boolean = false;

  constructor (operations: BountyOperation[] = []) {
    super({ allowedOperations: Object.keys(BountyOperation) as BountyOperation[] });

    this.addPermissions(operations);
  }
}
