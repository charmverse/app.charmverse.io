import { prisma, AvailablePostCategoryPermissions } from '@charmverse/core';
import type { PostCategoryPermissionFlags } from '@charmverse/core';

import { PostCategoryNotFoundError } from 'lib/forums/categories/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utilities/errors';
import { isUUID } from 'lib/utilities/strings';

import type { PermissionCompute } from '../interfaces';

export async function computePostCategoryPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<PostCategoryPermissionFlags> {
  if (!isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid post category ID: ${resourceId}`);
  }

  const postCategory = await prisma.postCategory.findUnique({
    where: { id: resourceId }
  });

  if (!postCategory) {
    throw new PostCategoryNotFoundError(`${resourceId}`);
  }

  const { isAdmin, spaceRole } = await hasAccessToSpace({
    spaceId: postCategory.spaceId,
    userId,
    disallowGuest: true
  });

  const permissions = new AvailablePostCategoryPermissions();

  if (isAdmin) {
    return permissions.full;

    // Requester is not a space member
  } else if (spaceRole) {
    permissions.addPermissions(['create_post']);
  }

  // Space members can post, people outside the space cannot perform any actions
  return permissions.operationFlags;
}
