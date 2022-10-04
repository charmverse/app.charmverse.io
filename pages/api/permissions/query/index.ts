
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';
import type { IPagePermissionUserRequest } from 'lib/permissions/pages/page-permission-interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys<IPagePermissionUserRequest>(['pageId', 'userId'], 'query'))
  .get(queryPagePermissions);

async function queryPagePermissions (req: NextApiRequest, res: NextApiResponse) {

  const request = req.query as unknown as IPagePermissionUserRequest;

  const userPermissions = await computeUserPagePermissions(request);

  return res.status(200).json(userPermissions);
}

export default withSessionRoute(handler);
