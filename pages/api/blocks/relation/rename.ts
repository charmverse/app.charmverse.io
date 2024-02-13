import { InvalidInputError } from '@charmverse/core/errors';
import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getRelationData } from 'lib/focalboard/getRelationData';
import { NotFoundError, onError, onNoMatch } from 'lib/middleware';
import { DEFAULT_BOARD_BLOCK_ID } from 'lib/rewards/blocks/constants';
import { withSessionRoute } from 'lib/session/withSession';

import type { SyncRelationPropertyPayload } from './sync';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.put(renameRelationProperty);

export type RenameRelationPropertyPayload = SyncRelationPropertyPayload;

async function renameRelationProperty(req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {
  const payload = req.body as SyncRelationPropertyPayload;
  const userId = req.session.user.id;
  const { relatedPropertyTitle, templateId } = payload;

  const {
    connectedBoard,
    connectedBoardProperties,
    isProposalsBoardConnected,
    isRewardsBoardConnected,
    spaceId,
    connectedBoardRelationProperty
  } = await getRelationData({
    ...payload,
    templateId,
    userId
  });

  if (!connectedBoardRelationProperty) {
    throw new NotFoundError('Connected relation property not found');
  }

  if (!relatedPropertyTitle) {
    throw new InvalidInputError('Please provide a new title for the related property');
  }

  const connectedBoardUpdatedFields = {
    ...(connectedBoard.fields as any),
    cardProperties: connectedBoardProperties.map((cp) => {
      if (cp.id === connectedBoardRelationProperty.id) {
        return {
          ...cp,
          name: relatedPropertyTitle
        };
      }
      return cp;
    })
  };

  if (isProposalsBoardConnected) {
    await prisma.proposalBlock.update({
      data: {
        fields: connectedBoardUpdatedFields,
        updatedBy: userId
      },
      where: {
        id_spaceId: {
          id: DEFAULT_BOARD_BLOCK_ID,
          spaceId
        }
      }
    });
  } else if (isRewardsBoardConnected) {
    await prisma.rewardBlock.update({
      data: {
        fields: connectedBoardUpdatedFields,
        updatedBy: userId
      },
      where: {
        id_spaceId: {
          id: DEFAULT_BOARD_BLOCK_ID,
          spaceId
        }
      }
    });
  } else {
    await prisma.block.update({
      data: {
        fields: connectedBoardUpdatedFields,
        updatedBy: userId
      },
      where: {
        id: connectedBoard.id
      }
    });
  }

  res.status(200).end();
}

export default withSessionRoute(handler);
