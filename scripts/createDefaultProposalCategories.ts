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

  await prisma.$transaction(spacesWithoutCategories.map(({ id }) => createCategoriesForSpace(id)))

  console.log('🔥 Created default categories for all spaces.');
}

function createCategoriesForSpace (id: string) {
  const categoriesInput = generateDefaultCategoriesInput(id);

  return prisma.proposalCategory.createMany({ data: categoriesInput });
}

migrateProposal();
