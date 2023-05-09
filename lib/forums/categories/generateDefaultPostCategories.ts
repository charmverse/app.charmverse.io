import type { Prisma } from '@charmverse/core/prisma';
import { v4 } from 'uuid';

import { getPostCategoryPath } from './getPostCategoryPath';

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
    spaceId,
    path: getPostCategoryPath(category),
    description: ''
  }));
}
