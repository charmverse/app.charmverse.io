import type { PostCategory } from '@prisma/client';

import { prisma } from 'db';

export type CreatePostCategoryInput = Pick<PostCategory, 'name' | 'spaceId'>;

export function createPostCategory({ name, spaceId }: CreatePostCategoryInput) {
  return prisma.postCategory.create({
    data: {
      name,
      space: {
        connect: {
          id: spaceId
        }
      }
    }
  });
}
