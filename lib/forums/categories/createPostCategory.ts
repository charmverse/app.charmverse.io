import type { PostCategory } from '@prisma/client';

import { prisma } from 'db';

import { getPostCategoryPath } from './getPostCategoryPath';

export type CreatePostCategoryInput = Pick<PostCategory, 'name' | 'spaceId'>;

export function createPostCategory({ name, spaceId }: CreatePostCategoryInput) {
  return prisma.postCategory.create({
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
}
