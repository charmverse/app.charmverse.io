import { Proposal, ProposalCategory } from "@prisma/client";
import { prisma } from "db";
import { getRandomThemeColor } from "theme/utils/getRandomThemeColor";


const concurrent = 5;

async function detectSpacesWithDuplicateCategories() {
  console.log('--- START --- Duplicate Detection')
  const spaces = await prisma.space.findMany({
    select: {
      id: true,
      domain: true,
      proposalCategory: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  console.log('Total spaces: ', spaces.length)

  const spacesWithDuplicates: {spaceId: string, domain: string, duplicates: Pick<ProposalCategory, 'id' | 'title'>[]}[] = [];

  for (const space of spaces) {
    space.proposalCategory.forEach((category) => {
      const duplicates = space.proposalCategory.filter(c => c.title === category.title);
      if (duplicates.length > 1) {
        spacesWithDuplicates.push({spaceId: space.id, domain: space.domain, duplicates});
      }
    })
  }


  console.log('Detected duplicates: ', spacesWithDuplicates.length, spacesWithDuplicates)

}


async function provisionGeneralProposalCategory() {
  console.log('--- START --- Provision general categories')
  const spacesWithoutGeneral = await prisma.space.findMany({
    where: {
      proposalCategory: {
        none: {
          title: 'General'
        }
      }
    },
    select: {
      id: true
    }
  });

  const totalSpaces = spacesWithoutGeneral.length;

  console.log('Total spaces without general category: ', totalSpaces)

  for (let i = 0; i < totalSpaces; i+= concurrent) {
    console.log('Creating general categories for spaces', i + 1, '-', i + 1 + concurrent, ' / ', totalSpaces, '...')
    await prisma.proposalCategory.createMany({
      data: spacesWithoutGeneral.slice(i, i + concurrent).map(space => ({
        color: getRandomThemeColor(),
        title: 'General',
        spaceId: space.id
      }))
    });
  }
}

async function assignProposalsToDefaultCategory() {
  const uncategorised = await prisma.proposal.findMany({
    where: {
      categoryId: null
    },
    select: {
      id: true,
      spaceId: true
    }
  });

  const bySpace = uncategorised.reduce((acc, proposal) => {

    if (!acc[proposal.spaceId]) {
      acc[proposal.spaceId] = [];
    }

    acc[proposal.spaceId].push(proposal);

    return acc;

  }, {} as Record<string, Pick<Proposal, 'id' | 'spaceId'>[]>)

  const uniqueSpaces = Object.keys(bySpace);

  for (let i = 0; i < uniqueSpaces.length; i+= concurrent) {
    const generalCategory = await prisma.proposalCategory.findFirst({
      where: {
        spaceId: uniqueSpaces[i],
        title: 'General'
      }
    });
    if (!generalCategory) {
      console.log('No general category found for space', uniqueSpaces[i]);
      continue;
    }

    await prisma.proposal.updateMany({
      where: {
        // Add this as a safeguard
        spaceId: uniqueSpaces[i],
        id: {
          in: bySpace[uniqueSpaces[i]].map(proposal => proposal.id)
        }
      },
      data: {
        categoryId: generalCategory.id
      }
    })
  }
}


export function migrateProposals() {
  detectSpacesWithDuplicateCategories();
}

migrateProposals()