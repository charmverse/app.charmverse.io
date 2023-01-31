import type { PostOperation } from '@prisma/client';

import { Permissions } from '../permissions.class';

import { postOperations } from './interfaces';

export class AvailablePostPermissions extends Permissions<PostOperation> {
  constructor() {
    super({ allowedOperations: postOperations.slice() });
  }
}
