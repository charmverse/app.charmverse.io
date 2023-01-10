import type { Prisma } from '@prisma/client';
import { v4 } from 'uuid';

export const defaultPostCategories = [
  'General',
  'Announcements',
  'Governance',
  'Random',
  'Introductions',
  'Questions & Support'
];

export function generateDefaultPostCategories(spaceId: string): Required<Prisma.PostCategoryCreateManyInput>[] {
  return defaultPostCategories.map((category) => ({
    id: v4(),
    name: category,
    spaceId
  }));
}
