import { prisma } from 'db';
import log from 'lib/log';
import uniq from 'lodash/uniq';

async function init () {
  const cards = await prisma.block.findMany({
    where: {
      type: 'card'
    },
    select: {
      rootId: true,
      id: true
    }
  });

  const boardIds = uniq(cards.map(c => c.rootId));
  const boardsInDb = await prisma.block.findMany({
    where: {
      id: {
        in: boardIds
      }
    }
  });
  const deletedBoardIds = boardIds.filter(id => !boardsInDb.some(p => p.id === id));
  const blocksToDelete = await prisma.block.findMany({
    where: {
      rootId: {
        in: deletedBoardIds
      }
    },
    select: {
      id: true
    }
  });

  // sanity check!
  if (deletedBoardIds.length > 0) {
    const board = await prisma.block.findUnique({
      where: {
        id: deletedBoardIds[0]
      }
    });
    if (board) {
      throw new Error(`Check the script! Found a board that is supposed to be deleted: ${deletedBoardIds[0]}`);
    }
  }

  const orphanCards = cards.filter(c => !boardsInDb.some(b => b.id === c.rootId));

  console.log('cards', cards.length);
  console.log('total boards', boardIds.length);
  console.log('deleted boards', deletedBoardIds.length);
  console.log('cards to delete', orphanCards.length);
  console.log('child blocks to delete', blocksToDelete.length);

  // await prisma.block.deleteMany({
  //   where: {
  //     id: {
  //       in: blocksToDelete.map(b => b.id)
  //     }
  //   }
  // });
}

init();
