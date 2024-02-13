import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { BoardFields } from 'lib/focalboard/board';
import { NotFoundError, onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.delete(removeRelationProperty);

export type RemoveRelationPropertyPayload = {
  boardId: string;
  templateId: string;
  removeBoth?: boolean;
};

async function removeRelationProperty(req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {
  const { removeBoth, boardId, templateId } = req.body as RemoveRelationPropertyPayload;

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

  await prisma.$transaction([
    prisma.block.update({
      data: {
        fields: {
          ...(connectedBoard?.fields as any),
          cardProperties: removeBoth
            ? connectedBoardProperties.filter((cp) => cp.id !== connectedBoardProperty.id)
            : connectedBoardProperties.map((cp) => {
                if (cp.id === connectedBoardProperty.id) {
                  return {
                    ...cp,
                    relationData: {
                      ...cp.relationData,
                      showOnRelatedBoard: false
                    }
                  };
                }
                return cp;
              })
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
                ...cp,
                relationData: {
                  ...cp.relationData,
                  showOnRelatedBoard: false
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
