
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { Page } from '@prisma/client';
import { prisma } from 'db';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';
import { deleteNestedChild } from 'lib/api/deleteNestedChild';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys(['id'], 'query'))
  .put(updatePage)
  .delete(deletePage);

async function updatePage (req: NextApiRequest, res: NextApiResponse) {

  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  const updateContent = req.body as Page;

  if (updateContent.isPublic !== undefined && permissions.edit_isPublic !== true) {
    return res.status(401).json({
      error: 'You cannot update the public status of this page'
    });
  }
  else if (permissions.edit_content !== true) {
    return res.status(401).json({
      error: 'You cannot update this page'
    });
  }

  const pageWithPermission = await prisma.page.update({
    where: {
      id: pageId
    },
    data: req.body,
    include: {
      permissions: true
    }
  });

  return res.status(200).json(pageWithPermission);
}

async function deletePage (req: NextApiRequest, res: NextApiResponse) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id as string;
  const permissionsSet = await computeUserPagePermissions({
    pageId,
    userId
  });

  if (!permissionsSet.delete) {
    return res.status(401).json({
      error: 'You are not allowed to perform this action'
    });
  }
  const { deletedChildPageIds, rootBlock } = (await deleteNestedChild(pageId, userId));
  return res.status(200).json({ deletedCount: deletedChildPageIds.length, rootBlock });
}

export default withSessionRoute(handler);
