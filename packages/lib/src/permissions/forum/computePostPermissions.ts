import { PostOperation, prisma } from '@charmverse/core/prisma-client';
import {
  defaultPostPolicies,
  hasAccessToSpace,
  postResolver,
  AvailablePostPermissions,
  buildComputePermissionsWithPermissionFilteringPolicies
} from '@packages/core/permissions';
import type { PostResource, PostPermissionFlags, PermissionCompute } from '@packages/core/permissions';
import { PostNotFoundError } from '@packages/lib/forums/posts/errors';
import { InvalidInputError } from '@packages/utils/errors';
import { isUUID } from '@packages/utils/strings';
import { typedKeys } from '@packages/utils/types';

export async function baseComputePostPermissions({
  resourceId,
  userId
}: PermissionCompute): Promise<PostPermissionFlags> {
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

  const { isAdmin, spaceRole, isReadonlySpace } = await hasAccessToSpace({
    spaceId: post.spaceId,
    userId
  });

  const permissions = new AvailablePostPermissions({ isReadonlySpace });

  if (post.createdBy === userId) {
    permissions.addPermissions(['edit_post', 'delete_post', 'view_post']);
  }

  // Provide admins with full access
  if (isAdmin) {
    return permissions.full;
    // Always allow space members to interact with posts
  } else if (spaceRole) {
    // Provide all permissions except edit post
    permissions.addPermissions(typedKeys(PostOperation).filter((op) => op !== 'edit_post'));
  } else {
    permissions.addPermissions(['view_post']);
  }

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
