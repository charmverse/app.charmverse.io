import { prisma } from '@charmverse/core/prisma-client';
import { BoardFields } from '@packages/databases/board';
import { CardFields } from '@packages/databases/card';

async function multiPersonProperty() {
  const boardPersonPropertyRecord: Record<
    string,
    {
      boardId: string;
      personPropertyId: string;
    }
  > = {};
  const boards = await prisma.block.findMany({
    where: {
      type: 'board'
    },
    select: {
      fields: true,
      id: true
    }
  });

  boards.forEach((board) => {
    const boardPersonProperty = (board.fields as unknown as BoardFields).cardProperties.find(
      (cardProperty) => cardProperty.type === 'person'
    );
    if (boardPersonProperty) {
      boardPersonPropertyRecord[board.id] = {
        boardId: board.id,
        personPropertyId: boardPersonProperty.id
      };
    }
  });

  const cards = await prisma.block.findMany({
    where: {
      type: 'card'
    },
    select: {
      parentId: true,
      fields: true,
      id: true
    }
  });

  for (const card of cards) {
    const boardPersonProperty = boardPersonPropertyRecord[card.parentId];
    if (boardPersonProperty) {
      const cardFields = card.fields as CardFields;
      const currentPersonPropertyValue = cardFields.properties[boardPersonProperty.personPropertyId];
      if (typeof currentPersonPropertyValue === 'string') {
        cardFields.properties[boardPersonProperty.personPropertyId] = [currentPersonPropertyValue];
        await prisma.block.update({
          where: {
            id: card.id
          },
          data: {
            fields: cardFields
          }
        });
      }
    }
  }
}

multiPersonProperty();
