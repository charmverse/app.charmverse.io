import { prisma } from 'db';
import { getPostCategories } from 'lib/forums/categories/getPostCategories';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

import { filterAccessiblePostCategories } from './filterAccessiblePostCategories';

type PostCategorySearchToMutate = {
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
  const { isAdmin } = await hasAccessToSpace({
    spaceId,
    userId
  });
  if (isAdmin) {
    return { categoryId };
  } else if (!categoryId) {
    const spacePostCategories = await getPostCategories(spaceId);
    const accessibleCategories = await filterAccessiblePostCategories({
      postCategories: spacePostCategories,
      userId
    });

    return {
      categoryId: accessibleCategories.map((category) => category.id)
    };
  } else if (typeof categoryId === 'string') {
    const postCategory = await prisma.postCategory.findUnique({ where: { id: categoryId } });
    if (!postCategory) {
      return { categoryId: [] };
    }
    const accessibleCategories = await filterAccessiblePostCategories({
      postCategories: [postCategory],
      userId
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
    const accessibleCategories = await filterAccessiblePostCategories({
      postCategories,
      userId
    });

    return {
      categoryId: accessibleCategories.map((category) => category.id)
    };
  }
}
