import { prisma } from '@charmverse/core';
import type { PostCategory, Space } from '@prisma/client';

export type SetDefaultPostCategoryRequest = {
  spaceId: string;
  postCategoryId: string;
};

export async function setDefaultPostCategory({
  postCategoryId,
  spaceId
}: SetDefaultPostCategoryRequest): Promise<Space> {
  const updatedSpace = await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      defaultPostCategory: {
        connect: {
          id: postCategoryId
        }
      }
    }
  });

  return updatedSpace;
}
