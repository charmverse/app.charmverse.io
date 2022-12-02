import type { PostCategory } from '@prisma/client';

import { prisma } from 'db';

export type PostCategoryUpdate = Partial<Pick<PostCategory, 'color' | 'name'>>;

export async function updatePostCategory(postCategoryId: string, update: PostCategoryUpdate): Promise<PostCategory> {
  return prisma.postCategory.update({
    where: {
      id: postCategoryId
    },
    data: update
  });
}
