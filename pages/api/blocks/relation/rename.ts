import { InvalidInputError } from '@charmverse/core/errors';
import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { BoardFields } from 'lib/focalboard/board';
import { NotFoundError, onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

import type { SyncRelationPropertyPayload } from './sync';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.put(renameRelationProperty);

export type RenameRelationPropertyPayload = SyncRelationPropertyPayload;

async function renameRelationProperty(req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {
  const { relatedPropertyTitle, boardId, templateId } = req.body as RenameRelationPropertyPayload;
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

  const connectedBoardProperty = connectedBoardProperties.find((p) => p.relationData?.relatedPropertyId === templateId);
  if (!connectedBoardProperty) {
    throw new NotFoundError('Connected relation property not found');
  }

  if (!relatedPropertyTitle) {
    throw new InvalidInputError('Please provide a new title for the related property');
  }

  await prisma.block.update({
    data: {
      fields: {
        ...(connectedBoard?.fields as any),
        cardProperties: connectedBoardProperties.map((cp) => {
          if (cp.id === connectedBoardProperty.id) {
            return {
              ...cp,
              name: relatedPropertyTitle
            };
          }
          return cp;
        })
      },
      updatedBy: userId
    },
    where: {
      id: connectedBoard.id
    }
  });

  res.status(200).end();
}

export default withSessionRoute(handler);
