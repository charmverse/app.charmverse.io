import type { PostOperation } from '@prisma/client';

import { BasePermissions } from '../basePermissions.class';
import { Permissions } from '../permissions.class';

import { postOperations } from './interfaces';

export class AvailablePostPermissions extends BasePermissions<PostOperation> {
  constructor() {
    super({ allowedOperations: postOperations.slice() });
  }
}
