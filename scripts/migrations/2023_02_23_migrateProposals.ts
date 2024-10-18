// @ts-nocheck
import { Proposal, ProposalCategory } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { disconnectProposalChildren } from 'lib/proposals/disconnectProposalChildren';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';

// Comment
const concurrent = 5;

async function disconnectProposalsFromChildren() {
  console.log('--- START --- Disconnecting proposals from children');
  const proposals = await prisma.proposal.findMany({
    select: {
      page: {
        select: {
          id: true
        }
      }
    }
  });

  let count = 0;
  let total = proposals.length;

  for (const proposal of proposals) {
    count += 1;
    console.log('Processing proposal', count, '/', total, '...');
    if (proposal.page?.id) {
      await disconnectProposalChildren({ pageId: proposal.page.id });
    }
  }
}

async function detectSpacesWithDuplicateCategories() {
  console.log('--- START --- Duplicate Detection');
  const spaces = await prisma.space.findMany({
    select: {
      id: true,
      domain: true,
      proposalCategories: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  console.log('Total spaces: ', spaces.length);

  const spacesWithDuplicates: {
    spaceId: string;
    domain: string;
    duplicates: Pick<ProposalCategory, 'id' | 'title'>[];
  }[] = [];

  for (const space of spaces) {
    space.proposalCategories.forEach((category) => {
      const duplicates = space.proposalCategories.filter((c) => c.title === category.title);
      if (duplicates.length > 1) {
        spacesWithDuplicates.push({ spaceId: space.id, domain: space.domain, duplicates });
      }
    });
  }

  console.log('Detected duplicates: ', spacesWithDuplicates.length, spacesWithDuplicates);
}

async function provisionGeneralProposalCategory() {
  console.log('--- START --- Provision general categories');
  const spacesWithoutGeneral = await prisma.space.findMany({
    where: {
      proposalCategories: {
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

  console.log('Total spaces without general category: ', totalSpaces);

  for (let i = 0; i < totalSpaces; i += concurrent) {
    console.log('Creating general categories for spaces', i + 1, '-', i + 1 + concurrent, ' / ', totalSpaces, '...');

    await Promise.all(
      spacesWithoutGeneral.slice(i, i + concurrent).map((space) =>
        prisma.proposalCategory.upsert({
          where: {
            spaceId_title: {
              spaceId: space.id,
              title: 'Other'
            }
          },
          create: {
            color: getRandomThemeColor(),
            title: 'General',
            space: { connect: { id: spacesWithoutGeneral[i].id } }
          },
          update: {
            title: 'General'
          }
        })
      )
    );
  }
}

async function assignProposalsToDefaultCategory() {
  console.log('--- START --- Assigning proposals to default category');
  const uncategorised = await prisma.proposal.findMany({
    where: {
      categoryId: null
    },
    select: {
      id: true,
      spaceId: true
    }
  });

  const bySpace = uncategorised.reduce(
    (acc, proposal) => {
      if (!acc[proposal.spaceId]) {
        acc[proposal.spaceId] = [];
      }

      acc[proposal.spaceId].push(proposal);

      return acc;
    },
    {} as Record<string, Pick<Proposal, 'id' | 'spaceId'>[]>
  );

  const uniqueSpaces = Object.keys(bySpace);

  for (let i = 0; i < uniqueSpaces.length; i += concurrent) {
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

    const proposalsToProcess = bySpace[uniqueSpaces[i]];

    await prisma.proposal.updateMany({
      where: {
        // Add this as a safeguard
        spaceId: uniqueSpaces[i],
        id: {
          in: proposalsToProcess.map((proposal) => proposal.id)
        }
      },
      data: {
        categoryId: generalCategory.id
      }
    });

    console.log('Processed: ', proposalsToProcess.length, 'proposals in space', i + 1, '/', uniqueSpaces.length);
  }
}

async function assignSpaceDefaultPermissions() {
  console.log('--- START --- Assigning default permissions to spaces');
  const spacesWithoutPermission = await prisma.space.findMany({
    where: {
      spacePermissions: {
        some: {
          spaceId: {
            not: null
          },
          NOT: {
            operations: {
              has: 'reviewProposals'
            }
          }
        }
      }
    },
    select: {
      id: true
    }
  });

  console.log('Found ', spacesWithoutPermission.length, 'spaces without reviewProposals permission');

  await prisma.spacePermission.updateMany({
    where: {
      spaceId: {
        in: spacesWithoutPermission.map((space) => space.id)
      }
    },
    data: {
      operations: {
        push: 'reviewProposals'
      }
    }
  });
}

export function migrateProposals() {
  // Ran this once, no duplicates detected
  //detectSpacesWithDuplicateCategories();

  provisionGeneralProposalCategory();
  assignProposalsToDefaultCategory();
  disconnectProposalsFromChildren();

  assignSpaceDefaultPermissions();
}

// migrateProposals()
