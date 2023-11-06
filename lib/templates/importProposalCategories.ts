import type { ProposalCategory } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { getSpace } from 'lib/spaces/getSpace';

import { getImportData } from './getImportData';
import type { ImportParams } from './interfaces';

type ProposalCategoryImportResult = {
  proposalCategories: ProposalCategory[];
  oldNewIdMap: Record<string, string>;
};

export async function importProposalCategories(params: ImportParams): Promise<ProposalCategoryImportResult> {
  const space = await getSpace(params.targetSpaceIdOrDomain);

  const { proposalCategories } = await getImportData(params);

  if (!proposalCategories) {
    return { proposalCategories: [], oldNewIdMap: {} };
  }

  // Retrieve all current categories in the space to check for duplicates
  const existingCategories = await prisma.proposalCategory.findMany({
    where: {
      spaceId: space.id
    }
  });

  const oldNewIdMap = new Map<string, ProposalCategory>();

  // Process each category to determine if it should be imported or matched
  for (const cat of proposalCategories) {
    const existingCategory = existingCategories.find((ec) => ec.title.toLowerCase() === cat.title.toLowerCase());

    if (existingCategory) {
      // If exists, add to map: old ID -> existing category
      oldNewIdMap.set(cat.id, existingCategory);
    } else {
      // If not, create new and add to map: old ID -> new category
      const newCategory = await prisma.proposalCategory.create({
        data: {
          title: cat.title,
          spaceId: space.id,
          color: cat.color
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
    proposalCategories: existingCategories, // Return all categories in the space
    oldNewIdMap: oldNewIdHashMap // Return old/new ID hashmap
  };
}
