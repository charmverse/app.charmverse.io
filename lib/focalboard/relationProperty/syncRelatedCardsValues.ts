import { prisma } from '@charmverse/core/prisma-client';

import { NotFoundError } from 'lib/middleware';

import type { IPropertyTemplate } from '../board';
import type { CardFields } from '../card';

import { getRelationData } from './getRelationData';

export type SyncRelatedCardsValuesPayload = {
  templateId: string;
  cardId: string;
  pageIds: string[];
  boardId: string;
};

async function syncRelatedCards({
  affectedCardPageIds,
  sourceCardId,
  relationProperty,
  operation,
  userId,
  spaceId,
  cardFields,
  sourceRelationProperty
}: {
  affectedCardPageIds: string[];
  sourceCardId: string;
  relationProperty: IPropertyTemplate;
  operation: 'remove' | 'add';
  userId: string;
  spaceId: string;
  cardFields: CardFields;
  sourceRelationProperty: IPropertyTemplate;
}) {
  const cards = await prisma.block.findMany({
    where: {
      id: {
        in: affectedCardPageIds
      },
      spaceId
    },
    select: {
      id: true,
      fields: true
    }
  });

  await prisma.$transaction([
    prisma.block.update({
      where: {
        id: sourceCardId
      },
      data: {
        fields: {
          ...(cardFields as any),
          properties: {
            ...(cardFields as CardFields).properties,
            [sourceRelationProperty.id]: affectedCardPageIds
          }
        },
        updatedBy: userId
      }
    }),
    ...cards.map((card) => {
      const connectedRelationPropertyValue = (card.fields as CardFields).properties[relationProperty.id] as
        | string[]
        | undefined;
      const connectedCardIds = Array.from(
        new Set(connectedRelationPropertyValue ? [sourceCardId, ...connectedRelationPropertyValue] : [sourceCardId])
      );

      return prisma.block.update({
        data: {
          fields: {
            ...(card.fields as any),
            properties: {
              ...(card.fields as CardFields).properties,
              [relationProperty.id]:
                operation === 'remove' ? connectedCardIds.filter((id) => id !== sourceCardId) : connectedCardIds
            }
          },
          updatedBy: userId
        },
        where: {
          id: card.id
        }
      });
    })
  ]);
}

export async function syncRelatedCardsValues(
  payload: SyncRelatedCardsValuesPayload & {
    userId: string;
  }
) {
  const { cardId, pageIds, templateId, boardId } = payload;

  const card = await prisma.block.findFirstOrThrow({
    where: {
      id: cardId
    },
    select: {
      fields: true
    }
  });

  const { connectedRelationProperty, sourceBoard, sourceRelationProperty } = await getRelationData({
    boardId,
    templateId
  });

  if (!connectedRelationProperty) {
    throw new NotFoundError('Connected relation type board property not found');
  }

  const cardFields = card.fields as CardFields;
  const cardRelationPropertyValue = (cardFields.properties[templateId] ?? []) as string[];

  const connectedPageIds = pageIds.filter((id) => !cardRelationPropertyValue.includes(id));
  const disconnectedPageIds = cardRelationPropertyValue.filter((id) => !pageIds.includes(id));

  if (connectedPageIds.length) {
    await syncRelatedCards({
      operation: 'add',
      affectedCardPageIds: connectedPageIds,
      relationProperty: connectedRelationProperty,
      sourceCardId: cardId,
      userId: payload.userId,
      spaceId: sourceBoard.spaceId,
      cardFields,
      sourceRelationProperty
    });
  }

  if (disconnectedPageIds.length) {
    await syncRelatedCards({
      operation: 'remove',
      affectedCardPageIds: disconnectedPageIds,
      relationProperty: connectedRelationProperty,
      sourceCardId: cardId,
      userId: payload.userId,
      spaceId: sourceBoard.spaceId,
      cardFields,
      sourceRelationProperty
    });
  }
}
