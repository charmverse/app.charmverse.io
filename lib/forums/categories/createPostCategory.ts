import type { PostCategory } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { getPostCategoryPath } from './getPostCategoryPath';

export type CreatePostCategoryInput = Pick<PostCategory, 'name' | 'spaceId'>;
export async function createPostCategory({ name, spaceId }: CreatePostCategoryInput): Promise<PostCategory> {
  const postCategory = await prisma.postCategory.create({
    data: {
      name,
      path: getPostCategoryPath(name),
      space: {
        connect: {
          id: spaceId
        }
      }
    }
  });

  return postCategory;
}
