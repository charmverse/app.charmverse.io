import type { Prisma } from '@prisma/client';

export const defaultPostCategories = [
  'General',
  'Announcements',
  'Governance',
  'Random',
  'Introductions',
  'Questions & Support'
];

export function generateDefaultPostCategories(spaceId: string): Prisma.PostCategoryCreateManyInput[] {
  return defaultPostCategories.map((category) => ({
    name: category,
    spaceId
  }));
}
