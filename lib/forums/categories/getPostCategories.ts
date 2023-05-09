import { prisma } from '@charmverse/core';
import type { PostCategory } from '@charmverse/core/prisma';

export async function getPostCategories(spaceId: string): Promise<PostCategory[]> {
  return prisma.postCategory.findMany({
    where: {
      spaceId
    }
  });
}
