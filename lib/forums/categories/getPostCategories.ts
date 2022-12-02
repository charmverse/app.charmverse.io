import type { PostCategory } from '@prisma/client';

import { prisma } from 'db';

export async function getPostCategories(spaceId: string): Promise<PostCategory[]> {
  return prisma.postCategory.findMany({
    where: {
      spaceId
    }
  });
}
