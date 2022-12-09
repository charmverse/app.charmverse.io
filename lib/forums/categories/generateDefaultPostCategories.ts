import type { Prisma } from '@prisma/client';

export const defaultPostCategories = ['Announcements', 'Governance', 'Random', 'Introductions', 'Questions & Support'];

export function generateDefaultPostCategoriesInput(spaceId: string): Prisma.PostCategoryCreateManyInput[] {
  return defaultPostCategories.map((category) => ({
    name: category,
    spaceId
  }));
}
