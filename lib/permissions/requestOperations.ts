import type { PostCategoryOperation, PostOperation } from '@prisma/client';

import { ActionNotPermittedError } from 'lib/middleware';
import { InvalidInputError } from 'lib/utilities/errors';

import { computePostCategoryPermissions } from './forum/computePostCategoryPermissions';
import { computePostPermissions } from './forum/computePostPermissions';
import type { PermissionCompute } from './interfaces';

type Resources = 'post_category' | 'post';

type OperationRequest<R extends Resources = Resources> = PermissionCompute & {
  resourceType: R;
  operations: (R extends 'post_category' ? PostCategoryOperation : R extends 'post' ? PostOperation : never)[];
};

/**
 * Request operations on a resource.
 * Returns true if all requested operations are allowed, otherwise throws an error.
 */
export async function requestOperations<R extends Resources = Resources>({
  resourceId,
  userId,
  operations,
  resourceType
}: OperationRequest<R>): Promise<true> {
  if (resourceType === 'post_category') {
    const permissions = await computePostCategoryPermissions({
      resourceId,
      userId
    });

    operations.forEach((op) => {
      if (!permissions[op as PostCategoryOperation]) {
        throw new ActionNotPermittedError(`You do not have permissions to perform this action`);
      }
    });

    return true;
  } else if (resourceType === 'post') {
    const permissions = await computePostPermissions({
      resourceId,
      userId
    });

    operations.forEach((op) => {
      if (!permissions[op as PostOperation]) {
        throw new ActionNotPermittedError(`You do not have permissions to perform this action`);
      }
    });

    return true;
  } else {
    throw new InvalidInputError(`Invalid resource type: ${resourceType}`);
  }
}
