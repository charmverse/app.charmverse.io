import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError, PostNotFoundError } from '@packages/core/errors';
import type {
  PermissionCompute,
  PermissionComputeWithCachedData,
  PostPermissionFlags,
  PostResource
} from '@packages/core/permissions';
import {
  AvailablePostPermissions,
  buildComputePermissionsWithPermissionFilteringPolicies,
  defaultPostPolicies,
  hasAccessToSpace,
  postResolver
} from '@packages/core/permissions';
import { stringUtils } from '@packages/core/utilities';

import { filterApplicablePermissions } from 'lib/corePermissions';

import { hasSpaceWideModerateForumsPermission } from './hasSpaceWideModerateForumsPermission';
import { postPermissionsMapping } from './mapping';

export async function baseComputePostPermissions({
  resourceId,
  userId,
  preComputedSpaceRole
}: PermissionCompute & PermissionComputeWithCachedData): Promise<PostPermissionFlags> {
  if (!stringUtils.isUUID(resourceId)) {
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

  const { isAdmin, spaceRole, isReadonlySpace } = await hasAccessToSpace({
    spaceId: post.spaceId,
    userId,
    preComputedSpaceRole
  });

  const permissions = new AvailablePostPermissions({ isReadonlySpace });

  if (post.createdBy === userId) {
    permissions.addPermissions(['edit_post', 'delete_post', 'view_post']);
  }

  if (isAdmin) {
    return permissions.full;
  }

  const hasSpaceWideModerate = await hasSpaceWideModerateForumsPermission({
    spaceId: post.spaceId,
    userId
  });

  if (hasSpaceWideModerate) {
    permissions.addPermissions(postPermissionsMapping.moderator);
    return permissions.operationFlags;
  }

  // User doesnt not have admin or space-wide moderator override. Apply normal permissions resolution
  const postCategoryPermissions = await prisma.postCategoryPermission.findMany({
    where: {
      postCategoryId: post.categoryId
    }
  });

  const applicablePermissions = await filterApplicablePermissions({
    permissions: postCategoryPermissions,
    resourceSpaceId: post.spaceId,
    // Treat user as a guest if they are not a full member of the space
    userId: !spaceRole || spaceRole?.isGuest ? undefined : userId,
    preComputedSpaceRole: spaceRole?.isGuest ? null : spaceRole
  });
  applicablePermissions.forEach((permission) => {
    permissions.addPermissions(postPermissionsMapping[permission.permissionLevel]);
  });

  return permissions.operationFlags;
}

export const computePostPermissions = buildComputePermissionsWithPermissionFilteringPolicies<
  PostResource,
  PostPermissionFlags
>({
  resolver: postResolver,
  computeFn: baseComputePostPermissions,
  policies: [...defaultPostPolicies]
});
