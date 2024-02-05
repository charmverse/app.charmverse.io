import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { BoardFields } from 'lib/focalboard/board';
import type { CardFields } from 'lib/focalboard/card';
import { NotFoundError, onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { isTruthy } from 'lib/utilities/types';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.put(syncRelationProperty);

export type SyncRelationPropertyValuePayload = {
  templateId: string;
  cardId: string;
  connectedCardIds: string[];
  boardId: string;
};

async function syncRelationProperty(req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {
  const { connectedCardIds, boardId, cardId, templateId } = req.body as SyncRelationPropertyValuePayload;

  const board = await prisma.block.findFirstOrThrow({
    where: {
      id: boardId
    },
    select: {
      id: true,
      fields: true
    }
  });

  const boardProperties = (board.fields as unknown as BoardFields).cardProperties;

  const relationProperty = boardProperties.find((p) => p.id === templateId);
  if (!relationProperty || !relationProperty.relationData) {
    throw new NotFoundError('Relation type board property not found');
  }

  const connectedBoard = await prisma.block.findUniqueOrThrow({
    where: {
      id: relationProperty.relationData.boardId
    },
    select: {
      id: true,
      fields: true
    }
  });

  const connectedRelationProperty = (connectedBoard.fields as unknown as BoardFields).cardProperties.find(
    (p) => p.id === relationProperty.relationData?.relatedPropertyId
  );

  if (!connectedRelationProperty) {
    throw new NotFoundError('Connected relation type board property not found');
  }

  const connectedBoardCardPages = await prisma.page.findMany({
    where: {
      id: {
        in: connectedCardIds
      }
    },
    select: {
      id: true,
      cardId: true
    }
  });

  const connectedBoardCards = await prisma.block.findMany({
    where: {
      id: {
        in: connectedBoardCardPages.map((p) => p.cardId).filter(isTruthy)
      }
    },
    select: {
      id: true,
      fields: true
    }
  });

  await prisma.$transaction([
    ...connectedBoardCards
      .map((connectedBoardCard) => {
        const connectedRelationPropertyValue = (connectedBoardCard.fields as CardFields).properties[
          connectedRelationProperty.id
        ] as string[] | undefined;
        return prisma.block.update({
          data: {
            fields: {
              ...(connectedBoardCard.fields as any),
              properties: {
                ...(connectedBoardCard.fields as CardFields).properties,
                [connectedRelationProperty.id]: Array.from(
                  new Set(
                    connectedRelationProperty.relationData?.limit === 'single_page'
                      ? [cardId]
                      : connectedRelationPropertyValue
                      ? [...connectedRelationPropertyValue, cardId]
                      : [cardId]
                  )
                )
              }
            }
          },
          where: {
            id: connectedBoardCard.id
          }
        });
      })
      .filter(isTruthy)
  ]);

  res.status(200).end();
}

export default withSessionRoute(handler);
