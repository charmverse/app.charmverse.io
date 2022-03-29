
import { PagePermission } from '@prisma/client';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { updatePagePermission } from 'lib/permissions/pages/page-permission-actions';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { IPagePermissionUpdate } from 'lib/permissions/pages/page-permission-interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
//  .use(requireSpaceMembership)
  .use(requireKeys<PagePermission>(['id'], 'query'))
  .put(updatePagePermissionLevel);

async function updatePagePermissionLevel (req: NextApiRequest, res: NextApiResponse) {

  const { id } = req.query;

  const updatedPermission = await updatePagePermission(id as string, req.body as IPagePermissionUpdate);

  return res.status(201).json(updatedPermission);
}

export default withSessionRoute(handler);
