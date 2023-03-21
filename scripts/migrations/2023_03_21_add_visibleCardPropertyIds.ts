import { prisma } from 'db';
import { prismaToBlock } from 'lib/focalboard/block';
import { Board } from 'lib/focalboard/board';

async function init() {
  const boards = await prisma.block.findMany({
    where: {
      type: "board"
    }
  })

  for (let board of boards) {
    const boardBlock = prismaToBlock(board) as Board
    await prisma.block.update({
      where: {
        id: boardBlock.id
      },
      data: {
        fields: {
          ...boardBlock.fields as Record<string, any>,
          visibleCardPropertyIds: boardBlock.fields.cardProperties.map(cardProperty => cardProperty.id)
        }
      }
    })
  }
}

init();