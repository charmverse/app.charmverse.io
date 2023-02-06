import type { PostCategory, Prisma } from '@prisma/client';

import { prisma } from 'db';

import { getPostCategoryPath } from './getPostCategoryPath';

export type CreatePostCategoryInput = Pick<PostCategory, 'name' | 'spaceId'>;

type CreatePostCategory = CreatePostCategoryInput & {
  tx?: Prisma.TransactionClient;
};

export function createPostCategory({ name, spaceId, tx = prisma }: CreatePostCategory): Promise<PostCategory> {
  return tx.postCategory.create({
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
