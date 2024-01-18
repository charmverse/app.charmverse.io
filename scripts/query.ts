import { prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

async function search() {
  const page = await prisma.page.findMany({
    where: {
      //title: 'Proposal Review - Grants Council Only'
      title: 'Matt Migration Proposal Review - Grants Council Only (Copy)'
    }
  });
  const boardBlock = await prisma.block.findUniqueOrThrow({
    where: {
      id: page[0].boardId!
    }
  });
  const cardBlocks = await prisma.block.findMany({
    where: {
      parentId: boardBlock.id
    },
    include: {
      page: {
        include: {
          permissions: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  const childPages = await prisma.page.findMany({
    where: {
      parentId: boardBlock.id
    }
  });
  const proposals = await prisma.page.findMany({
    where: {
      type: 'proposal',
      space: {
        domain: 'taiko'
      }
    }
  });
  console.log('proposals', proposals.length);
  console.log('child pages', childPages.length);
  //console.log(boardBlock);
  console.log('child cards', cardBlocks.length);
  console.log('cards without pages', cardBlocks.filter((c) => !c.page).length);
  console.log('cards with pages', cardBlocks.filter((c) => !!c.page).length);
}

search().then(() => console.log('Done'));
