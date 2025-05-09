import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { BlockWithDetails } from '@packages/databases/block';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';

// TODO: frontend should tell us which space to use
export type ServerBlockFields = 'spaceId' | 'updatedBy' | 'createdBy';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getViews);

async function getViews(req: NextApiRequest, res: NextApiResponse<BlockWithDetails[] | { error: string }>) {
  const pageId = req.query.id as string;
  const page = await prisma.page.findUniqueOrThrow({
    where: {
      id: pageId
    },
    select: {
      id: true,
      boardId: true
    }
  });

  const computed = await permissionsApiClient.pages.computePagePermissions({
    resourceId: page.id,
    userId: req.session.user?.id
  });

  if (computed.read !== true) {
    return res.status(404).json({ error: 'page not found' });
  }
  const blocks = page.boardId
    ? await prisma.block.findMany({
        where: {
          type: 'view',
          OR: [{ rootId: page.boardId }, { parentId: page.boardId }]
        }
      })
    : [];
  return res.status(200).json(blocks as BlockWithDetails[]);
}

export default withSessionRoute(handler);
