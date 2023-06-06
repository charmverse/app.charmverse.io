import type { Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch } from 'lib/middleware';
import { requireUser } from 'lib/middleware/requireUser';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';

// TODO: frontend should tell us which space to use
export type ServerBlockFields = 'spaceId' | 'updatedBy' | 'createdBy';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    providePermissionClients({
      key: 'pageId',
      location: 'query',
      resourceIdType: 'page'
    })
  )
  .get(getBlockPageViews);

async function getBlockPageViews(req: NextApiRequest, res: NextApiResponse<Block[] | { error: string }>) {
  const { pageId } = req.query as { pageId: string };
  const publicPage = await prisma.page.findFirst({
    where: {
      id: pageId as string,
      type: 'board'
    }
  });

  if (!publicPage) {
    throw new DataNotFoundError(`Views for page id ${pageId} not found`);
  }

  const computed = await req.basePermissionsClient.pages.computePagePermissions({
    resourceId: pageId,
    userId: req.session.user?.id
  });

  if (computed.read !== true) {
    throw new DataNotFoundError(`Views for page id ${pageId} not found`);
  }
  const blocks = await prisma.block.findMany({
    where: {
      type: 'view',
      rootId: publicPage.boardId!
    }
  });
  return res.status(200).json(blocks);
}

export default withSessionRoute(handler);
