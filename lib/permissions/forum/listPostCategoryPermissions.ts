import type { PostCategoryPermission } from '@prisma/client';

import { prisma } from 'db';
import { PostCategoryNotFoundError } from 'lib/forums/categories/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

import type { PermissionCompute, PermissionComputeRequest } from '../interfaces';

export async function listPostCategoryPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<PostCategoryPermission[]> {
  if (!userId) {
    return [];
  }

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

  return prisma.postCategoryPermission.findMany({
    where: {
      postCategoryId: resourceId
    }
  });
}
