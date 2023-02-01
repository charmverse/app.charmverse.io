import type { PostCategory, Prisma } from '@prisma/client';

import { prisma } from 'db';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { uniqueValues } from 'lib/utilities/array';
import { InvalidInputError } from 'lib/utilities/errors';

type CategoriesToFilter = {
  postCategories: PostCategory[];
  userId?: string;
};

export async function filterAccessiblePostCategories({
  postCategories,
  userId
}: CategoriesToFilter): Promise<PostCategory[]> {
  // Avoid expensive computation
  if (postCategories.length === 0) {
    return postCategories;
  }

  const uniqueSpaceIds = uniqueValues(postCategories.map((category) => category.spaceId));

  if (uniqueSpaceIds.length > 1) {
    throw new InvalidInputError(`Cannot filter categories from multiple spaces at once.`);
  }

  const spaceId = uniqueSpaceIds[0];

  const { error, isAdmin, spaceRole } = await hasAccessToSpace({
    spaceId,
    userId
  });

  if (isAdmin) {
    return postCategories;
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

    return postCategories.filter((category) =>
      publicCategoryPermissions.some((permission) => permission.postCategoryId === category.id)
    );
  } else {
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

    return postCategories.filter((category) => postCategoryPermissions.some((p) => p.postCategoryId === category.id));
  }
}
