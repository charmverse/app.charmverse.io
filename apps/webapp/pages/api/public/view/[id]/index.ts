import type { Page } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getPageByBlockViewId);

async function getPageByBlockViewId(req: NextApiRequest, res: NextApiResponse<Page>) {
  const { id } = req.query as { id: string };

  const view = await prisma.block.findFirst({
    where: {
      id: id as string,
      type: 'view'
    }
  });

  if (!view) {
    return res.status(400).json({ error: 'No such view exists' } as any);
  }

  const computed = await permissionsApiClient.pages.computePagePermissions({
    resourceId: id
  });

  if (computed.read !== true) {
    throw new DataNotFoundError('No such page exists');
  }

  const page = await prisma.page.findFirst({
    where: {
      boardId: view.rootId
    }
  });

  if (!page) {
    return res.status(400).json({ error: 'No such page exists' } as any);
  }

  return res.status(200).json(page);
}

export default withSessionRoute(handler);
