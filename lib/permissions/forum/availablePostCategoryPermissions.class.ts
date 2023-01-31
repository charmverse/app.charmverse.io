import type { PostCategoryOperation } from '@prisma/client';

import { BasePermissions } from '../basePermissions.class';
import { Permissions } from '../permissions.class';

import { postCategoryOperations } from './interfaces';

export class AvailablePostCategoryPermissions extends BasePermissions<PostCategoryOperation> {
  constructor() {
    super({ allowedOperations: postCategoryOperations.slice() });
  }
}
