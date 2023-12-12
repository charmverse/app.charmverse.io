import type { PostCategory } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { getSpace } from 'lib/spaces/getSpace';

import { getImportData } from './getImportData';
import type { ImportParams } from './interfaces';

type PostCategoryImportResult = {
  postCategories: PostCategory[];
  oldNewIdMap: Record<string, string>;
};

export async function importPostCategories(params: ImportParams): Promise<PostCategoryImportResult> {
  const space = await getSpace(params.targetSpaceIdOrDomain);

  const { postCategories } = await getImportData(params);

  if (!postCategories) {
    return { postCategories: [], oldNewIdMap: {} };
  }

  // Retrieve all current categories in the space to check for duplicates
  const existingCategories = await prisma.postCategory.findMany({
    where: {
      spaceId: space.id
    }
  });

  const oldNewIdMap = new Map<string, PostCategory>();

  // Process each category to determine if it should be imported or matched
  for (const cat of postCategories) {
    const existingCategory = existingCategories.find((ec) => ec.name.toLowerCase() === cat.name.toLowerCase());

    if (existingCategory) {
      // If exists, add to map: old ID -> existing category
      oldNewIdMap.set(cat.id, existingCategory);
    } else {
      // If not, create new and add to map: old ID -> new category
      const newCategory = await prisma.postCategory.create({
        data: {
          name: cat.name,
          spaceId: space.id,
          description: cat.description,
          path: cat.path
        }
      });
      oldNewIdMap.set(cat.id, newCategory);
      existingCategories.push(newCategory); // Add the new category to existing list
    }
  }

  // Convert the map to a simple object for easy access
  const oldNewIdHashMap: Record<string, string> = {};
  oldNewIdMap.forEach((value, key) => {
    oldNewIdHashMap[key] = value.id;
  });

  return {
    postCategories: existingCategories, // Return all categories in the space
    oldNewIdMap: oldNewIdHashMap // Return old/new ID hashmap
  };
}
