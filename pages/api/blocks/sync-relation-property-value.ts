import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { BoardFields } from 'lib/focalboard/board';
import type { CardFields } from 'lib/focalboard/card';
import { syncRelationPropertyCards } from 'lib/focalboard/syncRelationPropertyCards';
import { NotFoundError, onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.put(syncRelationProperty);

export type SyncRelationPropertyValuePayload = {
  templateId: string;
  cardId: string;
  cardIds: string[];
  boardId: string;
};

async function syncRelationProperty(req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {
  const { cardIds, boardId, cardId, templateId } = req.body as SyncRelationPropertyValuePayload;

  const card = await prisma.block.findFirstOrThrow({
    where: {
      id: cardId
    },
    select: {
      fields: true
    }
  });

  const cardFields = card.fields as CardFields;
  const cardRelationPropertyValue = (cardFields.properties[templateId] ?? []) as string[];

  const connectedCardIds = cardIds.filter((id) => !cardRelationPropertyValue.includes(id));
  const disconnectedCardIds = cardRelationPropertyValue.filter((id) => !cardIds.includes(id));

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

  if (connectedCardIds.length) {
    await syncRelationPropertyCards({
      operation: 'add',
      affectedCardPageIds: connectedCardIds,
      relationProperty: connectedRelationProperty,
      sourceCardId: cardId
    });
  }

  if (disconnectedCardIds.length) {
    await syncRelationPropertyCards({
      operation: 'remove',
      affectedCardPageIds: disconnectedCardIds,
      relationProperty: connectedRelationProperty,
      sourceCardId: cardId
    });
  }

  res.status(200).end();
}

export default withSessionRoute(handler);
