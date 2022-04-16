import { prisma } from 'db';

async function main () {
  const blocks = await prisma.block.findMany({
    where: {
      OR: [
        {
          type: 'charm_text'
        },
        {
          type: 'comment'
        }
      ]
    },
    select: {
      parentId: true,
      id: true
    }
  });

  const cardBlockIds = Array.from(new Set(blocks.map(block => block.parentId)));

  const cards = await prisma.block.findMany({
    where: {
      type: 'card',
      id: {
        in: cardBlockIds
      }
    },
    select: {
      id: true
    }
  });

  const aliveCardIds = new Set(cards.map(card => card.id));

  const blocksWhoseParentIsNotAlive = blocks.filter(block => !aliveCardIds.has(block.parentId));

  if (blocksWhoseParentIsNotAlive.length !== 0) {
    await prisma.block.deleteMany({
      where: {
        id: {
          in: blocksWhoseParentIsNotAlive.map(block => block.id)
        }
      }
    });
  }

  console.log(`Delete blocks ${blocksWhoseParentIsNotAlive.length}`);
}

main();
