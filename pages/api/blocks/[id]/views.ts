import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { getPermissionsClient, permissionsApiClient } from 'lib/permissions/api/client';
import { withSessionRoute } from 'lib/session/withSession';

// TODO: frontend should tell us which space to use
export type ServerBlockFields = 'spaceId' | 'updatedBy' | 'createdBy';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getViews);

async function getViews(req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {
  const blockId = req.query.id as string;
  const page = await prisma.page.findUniqueOrThrow({
    where: {
      id: blockId
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
      type: 'view',
      OR: [{ rootId: blockId }, { parentId: blockId }]
    }
  });
  return res.status(200).json(blocks);
}

export default withSessionRoute(handler);
