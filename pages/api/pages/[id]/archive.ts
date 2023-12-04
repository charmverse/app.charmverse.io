import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import type { ModifyChildPagesResponse } from 'lib/pages';
import { archivePages } from 'lib/pages/archivePages';
import { PageNotFoundError } from 'lib/pages/server';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'page'
    })
  )
  .use(requireKeys(['archive'], 'body'))
  .put(togglePageArchiveStatus);

async function togglePageArchiveStatus(req: NextApiRequest, res: NextApiResponse<ModifyChildPagesResponse>) {
  const pageId = req.query.id as string;
  const { archive } = req.body as { archive: boolean };
  const userId = req.session.user.id;

  const pageSpaceId = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      spaceId: true
    }
  });

  if (!pageSpaceId) {
    throw new PageNotFoundError(pageId);
  }

  const permissions = await req.basePermissionsClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (permissions.delete !== true) {
    throw new ActionNotPermittedError(`You do not have permissions to ${archive ? 'delete' : 'restore'} this page`);
  }

  const { modifiedChildPageIds } = await archivePages({
    archive,
    pageIds: [pageId],
    userId,
    spaceId: pageSpaceId.spaceId,
    emitPageStatusEvent: false,
    relay
  });

  return res.status(200).json({ pageIds: modifiedChildPageIds });
}

export default withSessionRoute(handler);
