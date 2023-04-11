import type { Post, PostOperation } from '@prisma/client';

import { prisma } from 'db';
import { PostNotFoundError } from 'lib/forums/posts/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utilities/errors';
import { typedKeys } from 'lib/utilities/objects';
import { isUUID } from 'lib/utilities/strings';

import type { PermissionFilteringPolicyFnInput } from '../buildComputePermissionsWithPermissionFilteringPolicies';
import { buildComputePermissionsWithPermissionFilteringPolicies } from '../buildComputePermissionsWithPermissionFilteringPolicies';
import { filterApplicablePermissions } from '../filterApplicablePermissions';
import type { PermissionCompute } from '../interfaces';

import { AvailablePostPermissions } from './availablePostPermissions.class';
import { hasSpaceWideModerateForumsPermission } from './hasSpaceWideModerateForumsPermission';
import type { AvailablePostPermissionFlags } from './interfaces';
import { postPermissionsMapping } from './mapping';

export async function baseComputePostPermissions({
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

  const { isAdmin, spaceRole } = await hasAccessToSpace({
    spaceId: post.spaceId,
    userId
  });

  const permissions = new AvailablePostPermissions();

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
    userId: !spaceRole || spaceRole?.isGuest ? undefined : userId
  });
  applicablePermissions.forEach((permission) => {
    permissions.addPermissions(postPermissionsMapping[permission.permissionLevel]);
  });

  return permissions.operationFlags;
}

type PostResource = Pick<Post, 'id' | 'spaceId' | 'createdBy' | 'proposalId' | 'isDraft'>;
type PostPolicyInput = PermissionFilteringPolicyFnInput<PostResource, AvailablePostPermissionFlags>;

async function convertedToProposalPolicy({ resource, flags }: PostPolicyInput): Promise<AvailablePostPermissionFlags> {
  const newPermissions = { ...flags };

  if (!resource.proposalId) {
    return newPermissions;
  }

  const allowedOperations: PostOperation[] = ['view_post', 'delete_post'];

  typedKeys(flags).forEach((flag) => {
    if (!allowedOperations.includes(flag)) {
      newPermissions[flag] = false;
    }
  });

  return newPermissions;
}

async function onlyEditableByAuthor({
  resource,
  flags,
  userId
}: PostPolicyInput): Promise<AvailablePostPermissionFlags> {
  const newPermissions = {
    ...flags,
    edit_post: resource.createdBy === userId
  };

  return newPermissions;
}

async function draftPostOnlyVisibleAndDeletableByAuthor({
  resource,
  flags,
  userId
}: PostPolicyInput): Promise<AvailablePostPermissionFlags> {
  const newPermissions = {
    ...flags,
    delete_post: resource.createdBy === userId,
    view_post: resource.createdBy === userId
  };

  return newPermissions;
}

async function disableUpvoteDownvoteDraftPost({
  resource,
  flags
}: PostPolicyInput): Promise<AvailablePostPermissionFlags> {
  const newPermissions = {
    ...flags,
    upvote: !resource.isDraft,
    downvote: !resource.isDraft
  };

  return newPermissions;
}

async function disableCommentOnDraftPost({ resource, flags }: PostPolicyInput): Promise<AvailablePostPermissionFlags> {
  const newPermissions = {
    ...flags,
    add_comment: !resource.isDraft
  };

  return newPermissions;
}

function postResolver({ resourceId }: { resourceId: string }) {
  return prisma.post.findUnique({
    where: { id: resourceId },
    select: {
      id: true,
      spaceId: true,
      createdBy: true,
      proposalId: true,
      isDraft: true
    }
  }) as Promise<PostResource>;
}

export const computePostPermissions = buildComputePermissionsWithPermissionFilteringPolicies<
  PostResource,
  AvailablePostPermissionFlags
>({
  resolver: postResolver,
  computeFn: baseComputePostPermissions,
  policies: [
    onlyEditableByAuthor,
    convertedToProposalPolicy,
    disableCommentOnDraftPost,
    disableUpvoteDownvoteDraftPost,
    draftPostOnlyVisibleAndDeletableByAuthor
  ]
});
