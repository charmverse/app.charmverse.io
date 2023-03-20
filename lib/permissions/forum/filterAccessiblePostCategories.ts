import type { PostCategory, PostCategoryPermission, Prisma } from '@prisma/client';

import { prisma } from 'db';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { uniqueValues } from 'lib/utilities/array';
import { InvalidInputError } from 'lib/utilities/errors';

import { AvailablePostCategoryPermissions } from './availablePostCategoryPermissions.class';
import { hasSpaceWideModerateForumsPermission } from './hasSpaceWideModerateForumsPermission';
import type { PostCategoryWithPermissions } from './interfaces';
import { postCategoryPermissionsMapping } from './mapping';

type CategoriesToFilter = {
  postCategories: PostCategory[];
  userId?: string;
};

export async function filterAccessiblePostCategories({
  postCategories,
  userId
}: CategoriesToFilter): Promise<PostCategoryWithPermissions[]> {
  // Avoid expensive computation
  if (postCategories.length === 0) {
    return [];
  }

  const uniqueSpaceIds = uniqueValues(postCategories.map((category) => category.spaceId));

  if (uniqueSpaceIds.length > 1) {
    throw new InvalidInputError(`Cannot filter categories from multiple spaces at once.`);
  }

  const spaceId = uniqueSpaceIds[0];

  const { error, isAdmin, spaceRole } = await hasAccessToSpace({
    spaceId,
    userId,
    disallowGuest: true
  });

  if (isAdmin) {
    const permissions = new AvailablePostCategoryPermissions().full;

    return postCategories.map((c) => ({ ...c, permissions }));
  }

  const postCategoryIds = postCategories.map((category) => category.id);

  // Handle non member case
  if (error || !spaceRole) {
    const publicCategoryPermissions = await prisma.postCategoryPermission.findMany({
      where: {
        public: true,
        postCategoryId: {
          in: postCategoryIds
        }
      }
    });

    const permissions = new AvailablePostCategoryPermissions().empty;

    return postCategories
      .filter((category) => publicCategoryPermissions.some((permission) => permission.postCategoryId === category.id))
      .map((c) => ({ ...c, permissions }));
  } else {
    const hasSpaceWideModerator = await hasSpaceWideModerateForumsPermission({
      spaceId,
      userId
    });

    if (hasSpaceWideModerator) {
      const moderatorPermissions = new AvailablePostCategoryPermissions();
      moderatorPermissions.addPermissions(postCategoryPermissionsMapping.moderator);
      return postCategories.map((c) => ({ ...c, permissions: moderatorPermissions.operationFlags }));
    }

    const userRolesInSpace = await prisma.spaceRoleToRole.findMany({
      where: {
        spaceRoleId: spaceRole.id
      },
      select: {
        roleId: true
      }
    });

    const roleIds = userRolesInSpace.map((spaceRoleToRole) => spaceRoleToRole.roleId);

    const orQuery: Prisma.PostCategoryPermissionWhereInput[] = [
      {
        spaceId
      },
      {
        public: true
      }
    ];

    if (roleIds.length > 0) {
      orQuery.push({
        roleId: {
          in: roleIds
        }
      });
    }
    const postCategoryPermissions = await prisma.postCategoryPermission.findMany({
      where: {
        postCategoryId: {
          in: postCategoryIds
        },
        OR: orQuery
      }
    });
    const mappedPostCategoryPermissions = postCategoryPermissions.reduce((acc, permission) => {
      if (!acc[permission.postCategoryId]) {
        acc[permission.postCategoryId] = [];
      }

      acc[permission.postCategoryId].push(permission);
      return acc;
    }, {} as Record<string, PostCategoryPermission[]>);

    // Optimise the computation to mutate returned values inside the filter operation
    return postCategories.filter((category) => {
      const relevantPermissions = mappedPostCategoryPermissions[category.id];

      if (!relevantPermissions || relevantPermissions.length === 0) {
        return false;
      }

      const permissions = new AvailablePostCategoryPermissions();

      relevantPermissions.forEach((perm) => {
        permissions.addPermissions(postCategoryPermissionsMapping[perm.permissionLevel]);
      });

      (category as PostCategoryWithPermissions).permissions = permissions.operationFlags;

      return true;
    }) as PostCategoryWithPermissions[];
  }
}
