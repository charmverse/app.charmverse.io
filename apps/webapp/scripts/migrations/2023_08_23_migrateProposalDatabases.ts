import { prisma } from '@charmverse/core/prisma-client';
//import path from 'node:'
import { writeToSameFolder } from 'lib/utils/file';

async function findNonCompliantProposalDatabases() {
  const proposalDatabaseViews = await prisma.block.findMany({
    where: {
      type: 'view',
      fields: {
        path: ['sourceType'],
        equals: 'proposals'
      }
    }
  });

  const otherViews = await prisma.block.findMany({
    where: {
      parentId: {
        in: proposalDatabaseViews.map((db) => db.parentId)
      },
      type: 'view',
      fields: {
        path: ['sourceType'],
        not: 'proposals'
      }
    }
  });

  //console.log('Found', proposalDatabaseViews.length)

  await writeToSameFolder({ data: JSON.stringify(otherViews, null, 2), fileName: `otherViews-${Date.now()}.json` });

  // await fs.writeFile()
  // return otherViews;
}

async function migrateAllProposalDatabases() {
  const proposalDatabaseViews = await prisma.block.findMany({
    where: {
      type: 'view',
      fields: {
        path: ['sourceType'],
        equals: 'proposals'
      }
    }
  });

  const parentBoards = await prisma.block.findMany({
    where: {
      type: 'board',
      id: {
        in: proposalDatabaseViews.map((db) => db.parentId)
      }
    }
  });

  for (let i = 0; i < parentBoards.length; i++) {
    await prisma.block.update({
      where: {
        id: parentBoards[i].id
      },
      data: {
        fields: {
          ...(parentBoards[i].fields as any),
          sourceType: 'proposals'
        }
      }
    });

    console.log('Updated ', i + 1, '/', parentBoards.length, 'proposal databases');
  }
}

migrateAllProposalDatabases().then(() => console.log('done'));
