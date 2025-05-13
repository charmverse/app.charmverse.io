import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { restoreDocument } from 'lib/pages/restoreDocument';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(restorePageController);

async function restorePageController(req: NextApiRequest, res: NextApiResponse) {
  const version = parseInt(req.query.version as any);

  const pageId = req.query.id as string;

  const permissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId: req.session.user?.id
  });

  if (!permissions.edit_content) {
    throw new ActionNotPermittedError(`You do not have permission to edit this page`);
  }

  const pageAfterUpdate = await restoreDocument({
    pageId,
    version: !Number.isNaN(version) ? version : undefined
  });

  return res.status(200).json(pageAfterUpdate);
}
export default withSessionRoute(handler);
