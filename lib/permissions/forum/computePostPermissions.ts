import type { Prisma } from '@prisma/client';

import { prisma } from 'db';
import { PostNotFoundError } from 'lib/forums/posts/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

import type { PermissionCompute } from '../interfaces';

import { AvailablePostPermissions } from './availablePostPermissions.class';
import { hasSpaceWideModerateForumsPermission } from './hasSpaceWideModerateForumsPermission';
import type { AvailablePostPermissionFlags } from './interfaces';
import { postPermissionsMapping } from './mapping';

export async function computePostPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<AvailablePostPermissionFlags> {
  if (!isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid post ID: ${resourceId}`);
  }

  const post = await prisma.post.findUnique({
    where: { id: resourceId },
    select: {
      categoryId: true,
      spaceId: true,
      createdBy: true
    }
  });

  if (!post) {
    throw new PostNotFoundError(`${resourceId}`);
  }

  const { error, isAdmin } = await hasAccessToSpace({
    spaceId: post.spaceId,
    userId
  });

  const permissions = new AvailablePostPermissions();

  if (isAdmin) {
    return {
      ...permissions.full,
      edit_post: post.createdBy === userId
    };

    // Requester does not have category permissions
  }

  const whereQuery: Prisma.PostCategoryPermissionWhereInput = {
    postCategoryId: post.categoryId
  };

  if (error || !userId) {
    whereQuery.public = true;
  } else {
    const hasSpaceWideModerate = await hasSpaceWideModerateForumsPermission({
      spaceId: post.spaceId,
      userId
    });

    if (hasSpaceWideModerate) {
      permissions.addPermissions(postPermissionsMapping.moderator);
      return {
        ...permissions.operationFlags,
        edit_post: post.createdBy === userId
      };
    }

    whereQuery.OR = [
      {
        public: true
      },
      {
        spaceId: post.spaceId
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
    ];
  }

  const assignedPermissions = await prisma.postCategoryPermission.findMany({
    where: whereQuery
  });

  assignedPermissions.forEach((permission) => {
    permissions.addPermissions(postPermissionsMapping[permission.permissionLevel]);
  });

  if (post.createdBy === userId) {
    permissions.addPermissions(['edit_post', 'delete_post']);
  }

  return permissions.operationFlags;
}
