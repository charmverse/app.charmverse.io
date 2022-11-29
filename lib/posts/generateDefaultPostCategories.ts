import type { Prisma } from '@prisma/client';

import { stringToColor } from 'lib/utilities/strings';

export const defaultPostCategories = ['Announcements', 'Governance', 'Random', 'Introductions', 'Questions & Support'];
export const defaultPostCategoryColours = defaultPostCategories.map((category) => stringToColor(category));

export function generateDefaultPostCategoriesInput(spaceId: string): Prisma.PostCategoryCreateManyInput[] {
  return defaultPostCategories.map((category, index) => ({
    name: category,
    spaceId,
    color: defaultPostCategoryColours[index]
  }));
}
