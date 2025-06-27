import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError, PostCategoryNotFoundError } from '@packages/core/errors';
import type { AssignedPostCategoryPermission, PermissionCompute } from '@packages/core/permissions';
import { hasAccessToSpace } from '@packages/core/permissions';
import { stringUtils } from '@packages/core/utilities';

import { mapPostCategoryPermissionToAssignee } from './mapPostCategoryPermissionToAssignee';

export async function listPostCategoryPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<AssignedPostCategoryPermission[]> {
  if (!userId) {
    return [];
  }

  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError('Invalid post category ID');
  }

  const postCategory = await prisma.postCategory.findUnique({
    where: {
      id: resourceId
    },
    select: {
      spaceId: true
    }
  });

  if (!postCategory) {
    throw new PostCategoryNotFoundError(resourceId);
  }

  const { spaceRole } = await hasAccessToSpace({
    spaceId: postCategory.spaceId,
    userId
  });

  if (!spaceRole) {
    return [];
  }

  const permissions = await prisma.postCategoryPermission.findMany({
    where: {
      postCategoryId: resourceId
    }
  });

  const mappedPermissions: AssignedPostCategoryPermission[] = permissions
    .map((permission) => {
      try {
        const mapped = mapPostCategoryPermissionToAssignee(permission);
        return mapped;
      } catch (err) {
        return null;
      }
    })
    .filter((permission) => permission !== null) as AssignedPostCategoryPermission[];

  return mappedPermissions;
}
