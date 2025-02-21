import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/utils/errors';

import { PostCategoryNotDeleteableError } from './errors';

export async function deletePostCategory(categoryId: string) {
  if (!categoryId) {
    throw new InvalidInputError(`Category ID is required to delete a post category`);
  }

  const postsCount = await prisma.post.count({
    where: {
      categoryId,
      deletedAt: null
    }
  });

  if (postsCount) {
    throw new PostCategoryNotDeleteableError();
  }

  // Need to delete post otherwise it will throw a foreign key constraint error, `Post_categoryId_fkey`
  // All these posts are already soft deleted, so we can just delete them all
  await prisma.post.deleteMany({
    where: {
      categoryId
    }
  });

  return prisma.postCategory.delete({
    where: {
      id: categoryId
    }
  });
}
