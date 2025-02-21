import type { Block, Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { isTruthy } from '@packages/lib/utils/types';
import { v4 } from 'uuid';

import type { CardFields } from '../card';

import { getRelationData } from './getRelationData';

export type SyncRelationPropertyPayload = {
  boardId: string;
  templateId: string;
  relatedPropertyTitle?: string;
};

export async function syncRelationProperty(
  payload: SyncRelationPropertyPayload & {
    userId: string;
  }
) {
  const { userId, relatedPropertyTitle, boardId, templateId } = payload;
  const {
    connectedBoard,
    sourceBoard,
    sourceBoardProperties,
    sourceBoardPage,
    sourceRelationProperty,
    connectedBoardProperties
  } = await getRelationData({
    boardId,
    templateId
  });

  const connectedRelationPropertyId = v4();
  const connectedBoardCards = await prisma.block.findMany({
    where: {
      type: 'card',
      parentId: connectedBoard.id
    },
    select: {
      fields: true,
      id: true
    }
  });

  const sourceBoardCards = await prisma.block.findMany({
    where: {
      type: 'card',
      parentId: sourceBoard.id
    },
    select: {
      fields: true,
      id: true
    }
  });

  const connectedBoardCardsRelatedCardsRecord: Record<string, string[]> = {};

  for (const card of sourceBoardCards) {
    const cardProperties = (card.fields as unknown as CardFields).properties;
    const boardCardRelationPropertyValue = cardProperties[sourceRelationProperty.id] as string[] | null;
    if (boardCardRelationPropertyValue) {
      boardCardRelationPropertyValue.forEach((connectedCardId) => {
        if (!connectedBoardCardsRelatedCardsRecord[connectedCardId]) {
          connectedBoardCardsRelatedCardsRecord[connectedCardId] = [card.id];
        } else {
          connectedBoardCardsRelatedCardsRecord[connectedCardId].push(card.id);
        }
      });
    }
  }

  const prismaPromises: Prisma.Prisma__BlockClient<Block, never>[] = [
    ...Object.entries(connectedBoardCardsRelatedCardsRecord)
      .map(([connectedCardId, connectedCardIds]) => {
        const connectedCardFields = connectedBoardCards.find((c) => c.id === connectedCardId)?.fields as CardFields;
        if (!connectedCardFields) {
          return null;
        }

        return prisma.block.update({
          data: {
            fields: {
              ...connectedCardFields,
              properties: {
                ...connectedCardFields.properties,
                [connectedRelationPropertyId]: connectedCardIds
              }
            }
          },
          where: {
            id: connectedCardId
          }
        });
      })
      .filter(isTruthy)
  ];

  if (sourceBoard.id === connectedBoard.id) {
    prismaPromises.push(
      prisma.block.update({
        data: {
          fields: {
            ...(sourceBoard.fields as any),
            cardProperties: [
              ...sourceBoardProperties.map((cp) => {
                if (cp.id === templateId) {
                  return {
                    ...sourceRelationProperty,
                    relationData: {
                      ...sourceRelationProperty.relationData,
                      showOnRelatedBoard: true,
                      relatedPropertyId: connectedRelationPropertyId
                    }
                  };
                }
                return cp;
              }),
              {
                id: connectedRelationPropertyId,
                type: 'relation',
                name: relatedPropertyTitle ?? `Related to ${sourceBoardPage.title || 'Untitled'}`,
                relationData: {
                  limit: 'multiple_page',
                  relatedPropertyId: templateId,
                  showOnRelatedBoard: true,
                  boardId: sourceBoard.id
                }
              }
            ]
          },
          updatedBy: userId
        },
        where: {
          id: sourceBoard.id
        }
      })
    );
  } else {
    prismaPromises.push(
      prisma.block.update({
        data: {
          fields: {
            ...(connectedBoard?.fields as any),
            cardProperties: [
              ...connectedBoardProperties,
              {
                id: connectedRelationPropertyId,
                type: 'relation',
                name: relatedPropertyTitle ?? `Related to ${sourceBoardPage.title || 'Untitled'}`,
                relationData: {
                  limit: 'multiple_page',
                  relatedPropertyId: templateId,
                  showOnRelatedBoard: true,
                  boardId: sourceBoard.id
                }
              }
            ]
          },
          updatedBy: userId
        },
        where: {
          id: connectedBoard.id
        }
      }),
      prisma.block.update({
        data: {
          fields: {
            ...(sourceBoard.fields as any),
            cardProperties: sourceBoardProperties.map((cp) => {
              if (cp.id === templateId) {
                return {
                  ...sourceRelationProperty,
                  relationData: {
                    ...sourceRelationProperty.relationData,
                    showOnRelatedBoard: true,
                    relatedPropertyId: connectedRelationPropertyId
                  }
                };
              }
              return cp;
            })
          },
          updatedBy: userId
        },
        where: {
          id: sourceBoard.id
        }
      })
    );
  }

  return prisma.$transaction(prismaPromises);
}
