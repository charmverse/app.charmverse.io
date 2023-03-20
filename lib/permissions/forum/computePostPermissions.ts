import type { Post, PostOperation, Prisma } from '@prisma/client';

import { prisma } from 'db';
import { PostNotFoundError } from 'lib/forums/posts/errors';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utilities/errors';
import { typedKeys } from 'lib/utilities/objects';
import { isUUID } from 'lib/utilities/strings';

import type { PermissionFilteringPolicyFnInput } from '../buildComputePermissionsWithPermissionFilteringPolicies';
import { buildComputePermissionsWithPermissionFilteringPolicies } from '../buildComputePermissionsWithPermissionFilteringPolicies';
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

  const { error, isAdmin } = await hasAccessToSpace({
    spaceId: post.spaceId,
    userId,
    // Provide guest same permission level as public
    disallowGuest: true
  });

  const permissions = new AvailablePostPermissions();

  if (isAdmin) {
    return permissions.full;

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
      return permissions.operationFlags;
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
    permissions.addPermissions(['edit_post', 'delete_post', 'view_post']);
  }

  return permissions.operationFlags;
}

type PostResource = Pick<Post, 'id' | 'spaceId' | 'createdBy' | 'proposalId'>;
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
function postResolver({ resourceId }: { resourceId: string }) {
  return prisma.post.findUnique({
    where: { id: resourceId },
    select: {
      id: true,
      spaceId: true,
      createdBy: true,
      proposalId: true
    }
  }) as Promise<PostResource>;
}

export const computePostPermissions = buildComputePermissionsWithPermissionFilteringPolicies<
  PostResource,
  AvailablePostPermissionFlags
>({
  resolver: postResolver,
  computeFn: baseComputePostPermissions,
  policies: [onlyEditableByAuthor, convertedToProposalPolicy]
});
