import { PostOperation } from '@charmverse/core/prisma';

import { typedKeys } from '../../utilities/objects';
import { BasePermissions } from '../core/basePermissions.class';

const readonlyOperations: PostOperation[] = ['view_post'];

export class AvailablePostPermissions extends BasePermissions<PostOperation> {
  constructor({ isReadonlySpace }: { isReadonlySpace: boolean }) {
    const allowedOperations = isReadonlySpace ? readonlyOperations : typedKeys(PostOperation);
    super({ allowedOperations });
  }
}
