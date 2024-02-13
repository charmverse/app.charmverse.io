import type { Block } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { NotFoundError } from 'lib/middleware/errors';
import { defaultRewardViews } from 'lib/rewards/blocks/views';

import type { BoardFields, IPropertyTemplate } from './board';
import { DEFAULT_BOARD_BLOCK_ID } from './customBlocks/constants';
import { getUpsertBlockInput } from './customBlocks/getUpsertBlockInput';

export async function getRelationData(
  args: (
    | {
        boardId: string;
      }
    | {
        boardType: 'rewards' | 'proposals';
        spaceId: string;
      }
  ) & {
    templateId: string;
    userId: string;
  }
) {
  const { templateId, userId } = args;
  const sourceBoard =
    'boardType' in args
      ? args.boardType === 'proposals'
        ? await prisma.proposalBlock.findUniqueOrThrow({
            where: {
              id_spaceId: {
                id: DEFAULT_BOARD_BLOCK_ID,
                spaceId: args.spaceId
              }
            },
            select: {
              id: true,
              fields: true,
              spaceId: true
            }
          })
        : await prisma.rewardBlock.findUniqueOrThrow({
            where: {
              id_spaceId: {
                id: DEFAULT_BOARD_BLOCK_ID,
                spaceId: args.spaceId
              }
            },
            select: {
              id: true,
              fields: true,
              spaceId: true
            }
          })
      : await prisma.block.findUniqueOrThrow({
          where: {
            id: args.boardId
          },
          select: {
            id: true,
            fields: true,
            spaceId: true
          }
        });

  const spaceId = sourceBoard.spaceId;

  const sourceBoardProperties = (sourceBoard.fields as unknown as BoardFields).cardProperties;

  const sourceBoardRelationProperty = sourceBoardProperties.find((p) => p.id === templateId);
  if (!sourceBoardRelationProperty || !sourceBoardRelationProperty.relationData) {
    throw new NotFoundError('Relation type board property not found');
  }

  const isProposalsBoardConnected = sourceBoardRelationProperty.relationData.boardType === 'proposals';
  const isRewardsBoardConnected = sourceBoardRelationProperty.relationData.boardType === 'rewards';

  if (isRewardsBoardConnected) {
    const existingBlock = await prisma.rewardBlock.findUnique({
      where: {
        id_spaceId: {
          id: DEFAULT_BOARD_BLOCK_ID,
          spaceId
        }
      }
    });

    if (!existingBlock) {
      await prisma.rewardBlock.upsert(
        getUpsertBlockInput({
          data: {
            id: DEFAULT_BOARD_BLOCK_ID,
            spaceId,
            fields: { viewIds: defaultRewardViews, cardProperties: [] }
          } as unknown as Block,
          userId,
          spaceId
        })
      );
    }
  } else if (isProposalsBoardConnected) {
    const existingBlock = await prisma.proposalBlock.findUnique({
      where: {
        id_spaceId: {
          id: DEFAULT_BOARD_BLOCK_ID,
          spaceId
        }
      }
    });

    if (!existingBlock) {
      await prisma.proposalBlock.upsert(
        getUpsertBlockInput({
          data: {
            id: DEFAULT_BOARD_BLOCK_ID,
            spaceId,
            fields: { viewIds: [], cardProperties: [] as IPropertyTemplate[] }
          } as unknown as Block,
          userId,
          spaceId
        })
      );
    }
  }

  let connectedBoard: {
    id: string;
    fields: Block['fields'];
  } | null = null;

  if (isRewardsBoardConnected) {
    connectedBoard = await prisma.rewardBlock.findUniqueOrThrow({
      where: {
        id_spaceId: {
          id: DEFAULT_BOARD_BLOCK_ID,
          spaceId
        }
      },
      select: {
        id: true,
        fields: true
      }
    });
  } else if (isProposalsBoardConnected) {
    connectedBoard = await prisma.proposalBlock.findUniqueOrThrow({
      where: {
        id_spaceId: {
          id: DEFAULT_BOARD_BLOCK_ID,
          spaceId
        }
      },
      select: {
        id: true,
        fields: true
      }
    });
  } else {
    connectedBoard = await prisma.block.findUniqueOrThrow({
      where: {
        id: sourceBoardRelationProperty.relationData.boardId
      },
      select: {
        id: true,
        fields: true
      }
    });
  }

  if (!connectedBoard) {
    throw new NotFoundError('Connected relation board not found');
  }

  const connectedBoardProperties = (connectedBoard.fields as unknown as BoardFields).cardProperties;

  const connectedBoardRelationProperty = connectedBoardProperties.find(
    (p) => p.relationData?.relatedPropertyId === templateId
  );

  return {
    sourceBoard,
    sourceBoardProperties,
    spaceId,
    connectedBoard,
    connectedBoardProperties,
    sourceBoardRelationProperty: sourceBoardRelationProperty as Omit<IPropertyTemplate, 'relationData'> & {
      relationData: NonNullable<IPropertyTemplate['relationData']>;
    },
    connectedBoardRelationProperty,
    isRewardsBoardConnected,
    isProposalsBoardConnected
  };
}
