import type { PostCategory } from '@prisma/client';

import { prisma } from 'db';

import { getPostCategoryPath } from './getPostCategoryPath';

export type PostCategoryUpdate = Partial<Pick<PostCategory, 'name' | 'description'>>;

export async function updatePostCategory(postCategoryId: string, update: PostCategoryUpdate): Promise<PostCategory> {
  return prisma.postCategory.update({
    where: {
      id: postCategoryId
    },
    data: {
      name: update.name ? update.name : undefined,
      path: update.name ? getPostCategoryPath(update.name) : undefined,
      description: update.description ? update.description : undefined
    }
  });
}
