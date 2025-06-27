import { prisma } from '@charmverse/core/prisma-client';
import { hasAccessToSpace } from '@packages/core/permissions';

import { getPermissionedCategories } from './getPermissionedCategories';
import { hasSpaceWideModerateForumsPermission } from './hasSpaceWideModerateForumsPermission';

export type PostCategorySearchToMutate = {
  categoryId?: string | string[];
  spaceId: string;
  userId?: string;
};
// Instead of applying permissions to posts, we can use this middleware to check if a user has access to a space's categories
export async function mutatePostCategorySearch({
  categoryId,
  spaceId,
  userId
}: PostCategorySearchToMutate): Promise<{ categoryId?: string | string[] }> {
  const { isAdmin, spaceRole } = await hasAccessToSpace({
    spaceId,
    userId
  });
  if (isAdmin) {
    return { categoryId };
  }

  const isSpaceWideModerator = await hasSpaceWideModerateForumsPermission({
    spaceId,
    userId
  });

  if (isSpaceWideModerator) {
    return { categoryId };
  }

  if (!categoryId) {
    const spacePostCategories = await prisma.postCategory.findMany({
      where: {
        spaceId
      }
    });
    const accessibleCategories = await getPermissionedCategories({
      postCategories: spacePostCategories,
      userId,
      preComputedSpaceRole: spaceRole
    });

    return {
      categoryId: accessibleCategories.map((category) => category.id)
    };
  } else if (typeof categoryId === 'string') {
    const postCategory = await prisma.postCategory.findUnique({ where: { id: categoryId } });
    if (!postCategory) {
      return { categoryId: [] };
    }
    const accessibleCategories = await getPermissionedCategories({
      postCategories: [postCategory],
      userId,
      preComputedSpaceRole: spaceRole
    });

    return {
      categoryId: accessibleCategories.length > 0 ? categoryId : []
    };
  } else {
    const postCategories = await prisma.postCategory.findMany({
      where: {
        id: {
          in: categoryId
        }
      }
    });
    const accessibleCategories = await getPermissionedCategories({
      postCategories,
      userId,
      preComputedSpaceRole: spaceRole
    });

    return {
      categoryId: accessibleCategories.map((category) => category.id)
    };
  }
}
