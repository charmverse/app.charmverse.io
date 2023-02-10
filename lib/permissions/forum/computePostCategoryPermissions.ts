import { prisma } from 'db';
import { PostCategoryNotFoundError } from 'lib/forums/categories/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

import type { PermissionCompute } from '../interfaces';

import { AvailablePostCategoryPermissions } from './availablePostCategoryPermissions.class';
import { hasSpaceWideModerateForumsPermission } from './hasSpaceWideModerateForumsPermission';
import type { AvailablePostCategoryPermissionFlags } from './interfaces';
import { postCategoryPermissionsMapping } from './mapping';

export async function computePostCategoryPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<AvailablePostCategoryPermissionFlags> {
  if (!isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid post category ID: ${resourceId}`);
  }

  const postCategory = await prisma.postCategory.findUnique({
    where: { id: resourceId }
  });

  if (!postCategory) {
    throw new PostCategoryNotFoundError(`${resourceId}`);
  }

  const { error, isAdmin } = await hasAccessToSpace({
    spaceId: postCategory.spaceId,
    userId
  });

  const permissions = new AvailablePostCategoryPermissions();

  if (isAdmin) {
    return permissions.full;

    // Requester is not a space member
  } else if (error) {
    return permissions.empty;
  }

  const hasSpaceWideModerate = await hasSpaceWideModerateForumsPermission({
    spaceId: postCategory.spaceId,
    userId
  });

  if (hasSpaceWideModerate) {
    permissions.addPermissions(postCategoryPermissionsMapping.moderator);
  }

  const assignedPermissions = await prisma.postCategoryPermission.findMany({
    where: {
      postCategoryId: resourceId,
      OR: [
        {
          spaceId: postCategory.spaceId
        },
        {
          role: {
            spaceRolesToRole: {
              some: {
                spaceRole: {
                  userId
                }
              }
            }
          }
        }
      ]
    }
  });

  assignedPermissions.forEach((permission) => {
    permissions.addPermissions(postCategoryPermissionsMapping[permission.permissionLevel]);
  });

  return permissions.operationFlags;
}
