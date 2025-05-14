import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { ServerBlockFields } from '@packages/databases/utils/blockUtils';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

// TODO: frontend should tell us which space to use

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getComments);

async function getComments(req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {
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
      type: 'comment',
      OR: [{ rootId: blockId }, { parentId: blockId }]
    }
  });
  return res.status(200).json(blocks);
}

export default withSessionRoute(handler);
