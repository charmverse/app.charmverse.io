import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { restoreDocument } from 'lib/pages/restoreDocument';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';

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
  .get(execScript);

async function execScript(req: NextApiRequest, res: NextApiResponse) {
  const version = parseInt(req.query.version as any);

  const pageId = req.query.id as string;

  const permissions = await req.basePermissionsClient.pages.computePagePermissions({
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
