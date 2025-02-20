import type { AssignedPostCategoryPermission } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import { isUUID } from '@packages/utils/strings';
import { PostCategoryNotFoundError } from '@root/lib/forums/categories/errors';
import { hasAccessToSpace } from '@root/lib/users/hasAccessToSpace';
import { InvalidInputError } from '@root/lib/utils/errors';

import type { PermissionCompute } from '../interfaces';

import { mapPostCategoryPermissionToAssignee } from './mapPostCategoryPermissionToAssignee';

export async function listPostCategoryPermissions({
  resourceId,
  userId
}: Required<PermissionCompute>): Promise<AssignedPostCategoryPermission[]> {
  if (!isUUID(resourceId)) {
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

  const { error } = await hasAccessToSpace({
    spaceId: postCategory.spaceId,
    userId
  });

  if (error) {
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
