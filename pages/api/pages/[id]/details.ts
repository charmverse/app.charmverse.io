import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, NotFoundError, onError, onNoMatch } from 'lib/middleware';
import type { PageDetails } from 'lib/pages';
import { getPageDetails } from 'lib/pages/server/getPageDetails';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'page'
    })
  )
  .get(getPageDetailsHandler);

async function getPageDetailsHandler(req: NextApiRequest, res: NextApiResponse<PageDetails>) {
  const pageIdOrPath = req.query.id as string;
  const userId = req.session?.user?.id;
  const pageDetails = await getPageDetails(pageIdOrPath, req.query.spaceId as string | undefined);

  if (!pageDetails) {
    throw new NotFoundError();
  }

  // Page ID might be a path now, so first we fetch the page and if found, can pass the id from the found page to check if we should actually send it to the requester
  const permissions = await req.basePermissionsClient.pages.computePagePermissions({
    resourceId: pageDetails.id,
    userId
  });

  if (!permissions.read) {
    const publicPagePermission = await prisma.pagePermission.count({
      where: {
        pageId: pageDetails.id,
        public: true
      }
    });
    if (!publicPagePermission) {
      throw new ActionNotPermittedError('You do not have permission to view this page');
    }
  }

  return res.status(200).json(pageDetails);
}

export default withSessionRoute(handler);
