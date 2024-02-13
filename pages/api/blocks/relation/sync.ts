import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 } from 'uuid';

import type { BoardFields, IPropertyTemplate } from 'lib/focalboard/board';
import type { CardFields } from 'lib/focalboard/card';
import { NotFoundError, onError, onNoMatch } from 'lib/middleware';
import { upsertBlock } from 'lib/proposal/blocks/upsertBlock';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/rewards/blocks/constants';
import { defaultRewardViews } from 'lib/rewards/blocks/views';
import { withSessionRoute } from 'lib/session/withSession';
import { isTruthy } from 'lib/utilities/types';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(syncRelationProperty);

export type SyncRelationPropertyPayload = {
  boardId: string;
  templateId: string;
  relatedPropertyTitle?: string;
};

async function syncRelationProperty(req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {
  const { relatedPropertyTitle, boardId, templateId } = req.body as SyncRelationPropertyPayload;
  const userId = req.session.user.id;

  const board = await prisma.block.findUniqueOrThrow({
    where: {
      id: boardId
    },
    select: {
      id: true,
      fields: true
    }
  });

  const boardPage = await prisma.page.findFirstOrThrow({
    where: {
      boardId
    },
    select: {
      id: true,
      title: true
    }
  });

  const boardProperties = (board.fields as unknown as BoardFields).cardProperties;

  const relationProperty = boardProperties.find((p) => p.id === templateId);
  if (!boardPage || !relationProperty || !relationProperty.relationData) {
    throw new NotFoundError('Relation type board property not found');
  }

  const connectedBoardId = relationProperty.relationData.boardId;
  const isProposalsBoardConnected = connectedBoardId.endsWith('-proposalsBoard');
  const isRewardsBoardConnected = connectedBoardId.endsWith('-rewardsBoard');

  if (isRewardsBoardConnected) {
    const spaceId = connectedBoardId.split('-rewardsBoard')[0];
    // safety check - if default board exists, do not override existing fields
    const existingBlock = await prisma.rewardBlock.findUnique({
      where: {
        id_spaceId: {
          id: DEFAULT_BOARD_BLOCK_ID,
          spaceId
        }
      }
    });

    let fields = { viewIds: defaultRewardViews, cardProperties: [] as IPropertyTemplate[] } as BoardFields;
    if (existingBlock) {
      const existingFields = existingBlock.fields as unknown as BoardFields;
      const viewIds = existingFields?.viewIds?.length ? existingFields?.viewIds : defaultRewardViews;
      const cardProperties = existingFields?.cardProperties?.length ? existingFields?.cardProperties : [];

      fields = { ...(existingBlock.fields as unknown as BoardFields), cardProperties, viewIds };
    }

    // generate / update existing board with 3 default views
    await upsertBlock({
      spaceId,
      userId,
      data: {
        type: 'board',
        id: DEFAULT_BOARD_BLOCK_ID,
        fields
      }
    });
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

  const connectedBoardProperties = (connectedBoard.fields as unknown as BoardFields).cardProperties;

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

  const boardCards = await prisma.block.findMany({
    where: {
      type: 'card',
      parentId: board.id
    },
    select: {
      fields: true,
      id: true
    }
  });

  const boardCardPages = boardCards.length
    ? await prisma.page.findMany({
        where: {
          id: {
            in: boardCards.map((c) => c.id)
          }
        },
        select: {
          id: true
        }
      })
    : [];

  const connectedBoardCardsRelatedCardsRecord: Record<string, string[]> = {};

  for (const boardCard of boardCards) {
    const boardCardPage = boardCardPages.find((p) => p.id === boardCard.id);
    const boardCardProperties = (boardCard.fields as unknown as CardFields).properties;
    const boardCardRelationPropertyValue = boardCardProperties[relationProperty.id] as string[] | null;
    if (boardCardPage && boardCardRelationPropertyValue) {
      boardCardRelationPropertyValue.forEach((connectedCardId) => {
        if (!connectedBoardCardsRelatedCardsRecord[connectedCardId]) {
          connectedBoardCardsRelatedCardsRecord[connectedCardId] = [boardCardPage.id];
        } else {
          connectedBoardCardsRelatedCardsRecord[connectedCardId].push(boardCardPage.id);
        }
      });
    }
  }

  await prisma.$transaction([
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
      .filter(isTruthy),
    prisma.block.update({
      data: {
        fields: {
          ...(connectedBoard?.fields as any),
          cardProperties: [
            ...connectedBoardProperties,
            {
              id: connectedRelationPropertyId,
              type: 'relation',
              name: relatedPropertyTitle ?? `Related to ${boardPage.title || 'Untitled'}`,
              relationData: {
                limit: relationProperty.relationData.limit,
                relatedPropertyId: templateId,
                showOnRelatedBoard: true,
                boardId: board.id
              }
            }
          ]
        }
      },
      where: {
        id: connectedBoard.id
      }
    }),
    prisma.block.update({
      data: {
        fields: {
          ...(board?.fields as any),
          cardProperties: boardProperties.map((cp) => {
            if (cp.id === templateId) {
              return {
                ...relationProperty,
                relationData: {
                  ...relationProperty.relationData,
                  showOnRelatedBoard: true,
                  relatedPropertyId: connectedRelationPropertyId
                }
              };
            }
            return cp;
          })
        }
      },
      where: {
        id: board.id
      }
    })
  ]);

  res.status(200).end();
}

export default withSessionRoute(handler);
