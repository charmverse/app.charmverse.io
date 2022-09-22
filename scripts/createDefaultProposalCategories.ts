import { ProposalStatus } from '@prisma/client';
import { prisma } from 'db';
import { generateDefaultCategoriesInput } from 'lib/proposal/generateDefaultCategoriesInput';

async function migrateProposal () {
  const spacesWithoutCategories = await prisma.space.findMany({
    where: {
      proposalCategory: {
          none: {} // Space has no categories
      }
    },
    select: {
      id: true
    }
  });

  console.log('🔥 Count of spaces without categories:', spacesWithoutCategories.length);

  await Promise.all(spacesWithoutCategories.map(({ id }) => createCategoriesForSpace(id)))

  console.log('🔥 Created default categories for all spaces.');
}

async function createCategoriesForSpace (id: string) {
  const categoriesInput = generateDefaultCategoriesInput(id);

  await prisma.proposalCategory.createMany({ data: categoriesInput });
}

migrateProposal();
