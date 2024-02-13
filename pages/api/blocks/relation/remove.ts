import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { DEFAULT_BOARD_BLOCK_ID } from 'lib/focalboard/customBlocks/constants';
import { getRelationData } from 'lib/focalboard/getRelationData';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(removeRelationProperty);

export type RemoveRelationPropertyPayload = (
  | {
      boardId: string;
    }
  | {
      boardType: 'rewards' | 'proposals';
      spaceId: string;
    }
) & {
  templateId: string;
  removeBoth?: boolean;
};

async function removeRelationProperty(req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {
  const payload = req.body as RemoveRelationPropertyPayload;
  const { removeBoth, templateId } = payload;
  const userId = req.session.user.id;

  const {
    sourceBoard,
    connectedBoard,
    connectedBoardProperties,
    isProposalsBoardConnected,
    isRewardsBoardConnected,
    spaceId,
    sourceBoardProperties,
    connectedBoardRelationProperty
  } = await getRelationData({
    ...payload,
    templateId,
    userId
  });

  const connectedBoardUpdatedFields = {
    ...(connectedBoard?.fields as any),
    cardProperties: removeBoth
      ? connectedBoardProperties.filter((cardProperty) => cardProperty.id !== connectedBoardRelationProperty?.id)
      : connectedBoardProperties.map((cardProperty) => {
          if (cardProperty.id === connectedBoardRelationProperty?.id) {
            return {
              ...cardProperty,
              relationData: {
                ...cardProperty.relationData,
                showOnRelatedBoard: false
              }
            };
          }
          return cardProperty;
        })
  };

  const sourceBoardUpdatedFields = {
    ...(sourceBoard.fields as any),
    cardProperties: sourceBoardProperties.map((cardProperty) => {
      if (cardProperty.id === templateId) {
        return {
          ...cardProperty,
          relationData: {
            ...cardProperty.relationData,
            showOnRelatedBoard: false
          }
        };
      }
      return cardProperty;
    })
  };

  await prisma.$transaction([
    ...(connectedBoardRelationProperty
      ? [
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
              })
        ]
      : []),
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
