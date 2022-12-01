import type { PostCategory } from '@prisma/client';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { prisma } from 'db';

export type CreatePostCategoryInput = Pick<PostCategory, 'name' | 'spaceId'> & { color?: SelectOptionType['color'] };

export function createPostCategory({ name, spaceId, color }: CreatePostCategoryInput) {
  const categoryColor = color ?? 'default';

  return prisma.postCategory.create({
    data: {
      name,
      space: {
        connect: {
          id: spaceId
        }
      },
      color: categoryColor
    }
  });
}
