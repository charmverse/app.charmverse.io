import { prisma } from '@charmverse/core';

import { InvalidInputError } from 'lib/utilities/errors';

import { PostCategoryNotDeleteableError } from './errors';

export async function deletePostCategory(categoryId: string) {
  if (!categoryId) {
    throw new InvalidInputError(`Category ID is required to delete a post category`);
  }

  const post = await prisma.post.findFirst({
    where: {
      categoryId
    },
    select: {
      id: true
    }
  });

  if (post) {
    throw new PostCategoryNotDeleteableError();
  }

  return prisma.postCategory.delete({
    where: {
      id: categoryId
    }
  });
}
