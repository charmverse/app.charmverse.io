/* eslint-disable no-console */
import { Block } from '@prisma/client';
import { prisma } from 'db';
import { Board, BoardFields } from 'lib/focalboard/board';
import { CardFields } from 'lib/focalboard/card';

/**
 * Publish or unpublish all cards in a board, and the board itself
 */
async function multiPersonProperty() {
  const boardPersonPropertyRecord: Record<string, {
    boardId: string
    personPropertyId: string
  }> = {}
  const boards = await prisma.block.findMany({
    where: {
      type: "board"
    }
  });

  boards.forEach(board => {
    const boardPersonProperty = (board.fields as unknown as BoardFields).cardProperties.find(cardProperty => cardProperty.type === "person")
    if (boardPersonProperty) {
      boardPersonPropertyRecord[board.id] = {
        boardId: board.id,
        personPropertyId: boardPersonProperty.id
      }
    }
  })

  const cards = await prisma.block.findMany({
    where: {
      type: "card"
    }
  })

  for (const card of cards) {
    const boardPersonProperty = boardPersonPropertyRecord[card.parentId];
    if (boardPersonProperty) {
      const cardFields = (card.fields as CardFields);
      const currentPersonPropertyValue = cardFields.properties[boardPersonProperty.personPropertyId];
      if (typeof currentPersonPropertyValue === "string") {
        cardFields.properties[boardPersonProperty.personPropertyId] = currentPersonPropertyValue ? [currentPersonPropertyValue] : []
        await prisma.block.update({
          where: {
            id: card.id
          },
          data: {
            fields: cardFields
          }
        })
      }
    }
  }
}

multiPersonProperty();