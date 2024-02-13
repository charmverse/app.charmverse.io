import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 } from 'uuid';

import type { CardFields } from 'lib/focalboard/card';
import { getRelationData } from 'lib/focalboard/getRelationData';
import { onError, onNoMatch } from 'lib/middleware';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/rewards/blocks/constants';
import { withSessionRoute } from 'lib/session/withSession';
import { isTruthy } from 'lib/utilities/types';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(syncRelationProperty);

export type SyncRelationPropertyPayload = (
  | {
      boardId: string;
    }
  | {
      boardType: 'rewards' | 'proposals';
      spaceId: string;
    }
) & {
  templateId: string;
  relatedPropertyTitle?: string;
};

async function syncRelationProperty(req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {
  const payload = req.body as SyncRelationPropertyPayload;
  const { relatedPropertyTitle, templateId } = payload;
  const userId = req.session.user.id;

  const {
    sourceBoard,
    connectedBoard,
    connectedBoardProperties,
    isProposalsBoardConnected,
    isRewardsBoardConnected,
    sourceBoardRelationProperty,
    spaceId,
    sourceBoardProperties
  } = await getRelationData({
    ...payload,
    templateId,
    userId
  });

  const boardPage =
    'boardType' in payload
      ? payload.boardType === 'proposals'
        ? {
            title: 'Proposals Board'
          }
        : {
            title: 'Rewards Board'
          }
      : await prisma.page.findFirstOrThrow({
          where: {
            boardId: payload.boardId
          },
          select: {
            title: true
          }
        });

  const boardPageTitle = boardPage.title;

  const connectedRelationPropertyId = v4();

  let connectedBoardCards: {
    id: string;
    fields: Block['fields'];
  }[] = [];
  let boardCards: { id: string; fields: Block['fields'] }[] = [];

  if (isProposalsBoardConnected) {
    connectedBoardCards = await prisma.proposalBlock.findMany({
      where: {
        type: 'card',
        parentId: DEFAULT_BOARD_BLOCK_ID,
        spaceId
      },
      select: {
        id: true,
        fields: true
      }
    });
  } else if (isRewardsBoardConnected) {
    connectedBoardCards = await prisma.rewardBlock.findMany({
      where: {
        type: 'card',
        parentId: DEFAULT_BOARD_BLOCK_ID,
        spaceId
      },
      select: {
        id: true,
        fields: true
      }
    });
  } else {
    connectedBoardCards = await prisma.block.findMany({
      where: {
        type: 'card',
        parentId: connectedBoard.id
      },
      select: {
        fields: true,
        id: true
      }
    });
  }

  if (!('boardType' in payload)) {
    boardCards = await prisma.block.findMany({
      where: {
        type: 'card',
        parentId: sourceBoard.id
      },
      select: {
        fields: true,
        id: true
      }
    });
  } else if (payload.boardType === 'rewards') {
    boardCards = await prisma.rewardBlock.findMany({
      where: {
        type: 'card',
        parentId: DEFAULT_BOARD_BLOCK_ID,
        spaceId
      },
      select: {
        id: true,
        fields: true
      }
    });
  } else if (payload.boardType === 'proposals') {
    boardCards = await prisma.proposalBlock.findMany({
      where: {
        type: 'card',
        parentId: DEFAULT_BOARD_BLOCK_ID,
        spaceId
      },
      select: {
        id: true,
        fields: true
      }
    });
  }

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
    const boardCardRelationPropertyValue = boardCardProperties[sourceBoardRelationProperty.id] as string[] | null;
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

  const sourceBoardUpdatedFields = {
    ...(sourceBoard?.fields as any),
    cardProperties: sourceBoardProperties.map((cp) => {
      if (cp.id === templateId) {
        return {
          ...sourceBoardRelationProperty,
          relationData: {
            ...sourceBoardRelationProperty.relationData,
            showOnRelatedBoard: true,
            relatedPropertyId: connectedRelationPropertyId
          }
        };
      }
      return cp;
    })
  };

  const connectedBoardUpdatedFields = {
    ...(connectedBoard?.fields as any),
    cardProperties: [
      ...connectedBoardProperties,
      {
        id: connectedRelationPropertyId,
        type: 'relation',
        name: relatedPropertyTitle ?? `Related to ${boardPageTitle ?? 'Untitled'}`,
        relationData: {
          limit: sourceBoardRelationProperty.relationData.limit,
          relatedPropertyId: templateId,
          showOnRelatedBoard: true,
          boardId: sourceBoard.id
        }
      }
    ]
  };

  await prisma.$transaction([
    ...Object.entries(connectedBoardCardsRelatedCardsRecord)
      .map(([connectedCardId, connectedCardIds]) => {
        const connectedCardFields = connectedBoardCards.find((c) => c.id === connectedCardId)?.fields as CardFields;
        if (!connectedCardFields) {
          return null;
        }

        const connectedCardUpdatedFields = {
          ...connectedCardFields,
          properties: {
            ...connectedCardFields.properties,
            [connectedRelationPropertyId]: connectedCardIds
          }
        };

        if (isProposalsBoardConnected) {
          return prisma.proposalBlock.update({
            data: {
              fields: connectedCardUpdatedFields
            },
            where: {
              id_spaceId: {
                id: connectedCardId,
                spaceId
              }
            }
          });
        } else if (isRewardsBoardConnected) {
          return prisma.rewardBlock.update({
            data: {
              fields: connectedCardUpdatedFields
            },
            where: {
              id_spaceId: {
                id: connectedCardId,
                spaceId
              }
            }
          });
        }

        return prisma.block.update({
          data: {
            fields: connectedCardUpdatedFields
          },
          where: {
            id: connectedCardId
          }
        });
      })
      .filter(isTruthy),
    isProposalsBoardConnected
      ? prisma.proposalBlock.update({
          data: {
            fields: connectedBoardUpdatedFields
          },
          where: {
            id_spaceId: {
              id: DEFAULT_BOARD_BLOCK_ID,
              spaceId
            }
          }
        })
      : isRewardsBoardConnected
      ? prisma.rewardBlock.update({
          data: {
            fields: connectedBoardUpdatedFields
          },
          where: {
            id_spaceId: {
              id: DEFAULT_BOARD_BLOCK_ID,
              spaceId
            }
          }
        })
      : prisma.block.update({
          data: {
            fields: connectedBoardUpdatedFields
          },
          where: {
            id: connectedBoard.id
          }
        }),

    !('boardType' in payload)
      ? prisma.block.update({
          data: {
            fields: sourceBoardUpdatedFields
          },
          where: {
            id: sourceBoard.id
          }
        })
      : payload.boardType === 'proposals'
      ? prisma.proposalBlock.update({
          data: {
            fields: sourceBoardUpdatedFields
          },
          where: {
            id_spaceId: {
              id: DEFAULT_BOARD_BLOCK_ID,
              spaceId
            }
          }
        })
      : prisma.rewardBlock.update({
          data: {
            fields: sourceBoardUpdatedFields
          },
          where: {
            id_spaceId: {
              id: DEFAULT_BOARD_BLOCK_ID,
              spaceId
            }
          }
        })
  ]);

  res.status(200).end();
}

export default withSessionRoute(handler);
