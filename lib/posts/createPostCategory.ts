import type { PostCategory } from '@prisma/client';

import { prisma } from 'db';
import { stringToColor } from 'lib/utilities/strings';

export type CreatePostCategoryInput = Pick<PostCategory, 'name' | 'spaceId'> & Partial<Pick<PostCategory, 'color'>>;

export function createPostCategory({ name, spaceId, color }: CreatePostCategoryInput) {
  const categoryColour = color ?? stringToColor(name);

  return prisma.postCategory.create({
    data: {
      name,
      space: {
        connect: {
          id: spaceId
        }
      },
      color: categoryColour
    }
  });
}
