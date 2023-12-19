import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { BoardViewFields } from 'lib/focalboard/boardView';
import { onError, onNoMatch } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/routers';
import { withSessionRoute } from 'lib/session/withSession';

// TODO: frontend should tell us which space to use
export type ServerBlockFields = 'spaceId' | 'updatedBy' | 'createdBy';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getBlockSubtree);

async function getBlockSubtree(req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {
  const blockId = req.query.id as string;
  const page = await prisma.page.findFirstOrThrow({
    where: {
      OR: [{ boardId: blockId }, { cardId: blockId }]
    },
    select: {
      id: true
    }
  });

  const computed = await permissionsApiClient.pages.computePagePermissions({
    resourceId: page.id,
    userId: req.session.user?.id
  });

  if (computed.read !== true) {
    return res.status(404).json({ error: 'page not found' });
  }
  const blocks = await prisma.block.findMany({
    where: {
      OR: [{ id: blockId }, { rootId: blockId }, { parentId: blockId }]
    }
  });

  const viewsWithLinkedSource = blocks.filter((b) => b.type === 'view' && (b.fields as BoardViewFields).linkedSourceId);

  if (viewsWithLinkedSource.length > 0) {
    const sourceDatabaseIds = viewsWithLinkedSource.map((b) => (b.fields as BoardViewFields).linkedSourceId as string);

    const linkedDatabaseBlocks = await prisma.block.findMany({
      where: {
        OR: [
          {
            id: {
              in: sourceDatabaseIds
            }
          },
          {
            rootId: {
              in: sourceDatabaseIds
            }
          },
          {
            parentId: {
              in: sourceDatabaseIds
            }
          }
        ]
      }
    });

    blocks.push(...linkedDatabaseBlocks);
  }

  return res.status(200).json(blocks);
}

export default withSessionRoute(handler);
