import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError, PostCategoryNotFoundError } from '@packages/core/errors';
import type { PermissionCompute, PostCategoryPermissionFlags } from '@packages/core/permissions';
import { hasAccessToSpace, AvailablePostCategoryPermissions } from '@packages/core/permissions';
import { stringUtils } from '@packages/core/utilities';

import { filterApplicablePermissions } from 'lib/corePermissions';

import { hasSpaceWideModerateForumsPermission } from './hasSpaceWideModerateForumsPermission';
import { postCategoryPermissionsMapping } from './mapping';

export async function computePostCategoryPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<PostCategoryPermissionFlags> {
  if (!stringUtils.isUUID(resourceId)) {
    throw new InvalidInputError(`Invalid post category ID: ${resourceId}`);
  }

  const postCategory = await prisma.postCategory.findUnique({
    where: { id: resourceId }
  });

  if (!postCategory) {
    throw new PostCategoryNotFoundError(`${resourceId}`);
  }

  const { spaceRole, isAdmin, isReadonlySpace } = await hasAccessToSpace({
    spaceId: postCategory.spaceId,
    userId
  });

  const permissions = new AvailablePostCategoryPermissions({ isReadonlySpace });

  if (isAdmin) {
    return permissions.full;
  } else if (!spaceRole || spaceRole.isGuest) {
    return permissions.empty;
  }

  const hasSpaceWideModerate = await hasSpaceWideModerateForumsPermission({
    spaceId: postCategory.spaceId,
    userId
  });

  if (hasSpaceWideModerate) {
    permissions.addPermissions(postCategoryPermissionsMapping.moderator);
    return permissions.operationFlags;
  }

  const assignedPermissions = await prisma.postCategoryPermission.findMany({
    where: {
      postCategoryId: resourceId
    }
  });

  const applicablePermissions = await filterApplicablePermissions({
    permissions: assignedPermissions,
    resourceSpaceId: postCategory.spaceId,
    userId,
    preComputedSpaceRole: spaceRole
  });

  applicablePermissions.forEach((permission) => {
    permissions.addPermissions(postCategoryPermissionsMapping[permission.permissionLevel]);
  });

  return permissions.operationFlags;
}
