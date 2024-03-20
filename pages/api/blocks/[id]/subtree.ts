import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { BoardFields } from 'lib/databases/board';
import type { BoardViewFields } from 'lib/databases/boardView';
import { getRelatedBlocks } from 'lib/databases/getRelatedBlocks';
import { onError, onNoMatch } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { withSessionRoute } from 'lib/session/withSession';
import { isTruthy } from 'lib/utils/types';

// TODO: frontend should tell us which space to use
export type ServerBlockFields = 'spaceId' | 'updatedBy' | 'createdBy';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getBlockSubtree);

export const config = {
  api: {
    // silence errors about response size
    // https://nextjs.org/docs/messages/api-routes-response-size-limit
    responseLimit: false
  }
};

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

  const { blocks } = await getRelatedBlocks(blockId);

  return res.status(200).json(blocks);
}

export default withSessionRoute(handler);
