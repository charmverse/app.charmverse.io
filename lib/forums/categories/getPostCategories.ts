import { prisma } from '@charmverse/core';
import type { PostCategory } from '@prisma/client';

export async function getPostCategories(spaceId: string): Promise<PostCategory[]> {
  return prisma.postCategory.findMany({
    where: {
      spaceId
    }
  });
}
