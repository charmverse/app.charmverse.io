
import { PagePermission, PagePermissionLevel, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { isTruthy } from 'lib/utilities/types';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { createPagePermission, deletePagePermission, listPagePermissions } from 'lib/permissions/pages/page-permission-actions';
import { IPagePermissionRequest, IPagePermissionToDelete, IPagePermissionWithAssignee } from 'lib/permissions/pages/page-permission-interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
//  .use(requireSpaceMembership)
  .get(findPagePermissions)
  .post(addPagePermission)
  .delete(removePagePermission);

async function findPagePermissions (req: NextApiRequest, res: NextApiResponse<IPagePermissionWithAssignee []>) {

  const { pageId } = req.query as any as IPagePermissionRequest;

  const permissions = await listPagePermissions(pageId);

  return res.status(200).json(permissions);
}

async function addPagePermission (req: NextApiRequest, res: NextApiResponse) {

  const createdPermission = await createPagePermission(req.body);

  return res.status(201).json(createdPermission);
}

async function removePagePermission (req: NextApiRequest, res: NextApiResponse) {

  const { permissionId } = req.body as IPagePermissionToDelete;

  await deletePagePermission(req.body.permissionId);

  return res.status(200).json({
    success: true
  });
}

export default withSessionRoute(handler);
