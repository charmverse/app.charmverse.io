
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';
import { IPagePermissionUserRequest } from 'lib/permissions/pages/page-permission-interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

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
