import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 } from 'uuid';

import type { BoardFields } from 'lib/focalboard/board';
import { NotFoundError, onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.put(syncRelationProperty);

export type SyncRelationPropertyPayload = {
  boardId: string;
  templateId: string;
  action: 'create' | 'rename' | 'delete';
  relatedPropertyTitle?: string;
};

async function syncRelationProperty(req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {
  const { action, relatedPropertyTitle, boardId, templateId } = req.body as SyncRelationPropertyPayload;

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

  if (action === 'create') {
    const connectedRelationPropertyId = v4();

    await prisma.$transaction([
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
  }

  res.status(200).end();
}

export default withSessionRoute(handler);
