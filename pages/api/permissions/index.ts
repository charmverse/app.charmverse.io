
import { PagePermission } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { deletePagePermission, IPagePermissionRequest, IPagePermissionToDelete, IPagePermissionWithAssignee, listPagePermissions, setupPermissionsAfterPagePermissionAdded, upsertPermission } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
//  .use(requireSpaceMembership)
  .get(findPagePermissions)
  .delete(removePagePermission)
  .use(requireKeys<PagePermission>(['pageId'], 'body'))
  .post(addPagePermission);

async function findPagePermissions (req: NextApiRequest, res: NextApiResponse<IPagePermissionWithAssignee []>) {

  const { pageId } = req.query as any as IPagePermissionRequest;

  const permissions = await listPagePermissions(pageId);

  return res.status(200).json(permissions);
}

async function addPagePermission (req: NextApiRequest, res: NextApiResponse) {

  console.log('Received request', req.body);

  const { pageId } = req.body;

  // Count before and after permissions so we don't trigger the event unless necessary
  const permissionsBefore = await prisma.pagePermission.count({
    where: {
      pageId
    }
  });

  const createdPermission = await upsertPermission(pageId, req.body);

  const permissionsAfter = await prisma.pagePermission.count({
    where: {
      pageId
    }
  });

  // TODO - This could be an async job, but there is a risk of the UI being out of sync
  if (permissionsAfter > permissionsBefore) {
    await setupPermissionsAfterPagePermissionAdded(createdPermission.id);
  }

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
