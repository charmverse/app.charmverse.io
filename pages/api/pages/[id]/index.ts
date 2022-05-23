
import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeUserPagePermissions, setupPermissionsAfterPageRepositioned } from 'lib/permissions/pages';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { withSessionRoute } from 'lib/session/withSession';
import { Page } from '@prisma/client';
import { prisma } from 'db';
import { modifyChildPages } from 'lib/pages/modifyChildPages';
import { ModifyChildPagesResponse } from 'lib/pages';
import { getPage } from 'lib/pages/server/getPage';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .use(requireKeys(['id'], 'query'))
  .get(getPageRoute)
  .put(updatePage)
  .delete(deletePage);

async function getPageRoute (req: NextApiRequest, res: NextApiResponse<Page>) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  if (permissions.read !== true) {
    throw new ActionNotPermittedError('You do not have permission to view this page');
  }

  const page = await getPage(pageId);

  if (!page) {
    throw new NotFoundError();
  }

  return res.status(200).json(page);
}

async function updatePage (req: NextApiRequest, res: NextApiResponse) {

  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  const updateContent = req.body as Page ?? {};

  if ((typeof updateContent.index === 'number' || updateContent.parentId !== undefined) && permissions.edit_position !== true) {
    throw new ActionNotPermittedError('You do not have permission to reposition this page');
  }

  if (updateContent.hasOwnProperty('isPublic') && permissions.edit_isPublic !== true) {
    throw new ActionNotPermittedError('You do not have permission to update the public status of this page');
  }
  else if (permissions.edit_content !== true) {
    throw new ActionNotPermittedError('You do not have permission to update this page');
  }
  const pageWithPermission = await prisma.page.update({
    where: {
      id: pageId
    },
    data: {
      ...req.body,
      updatedAt: new Date(),
      updatedBy: userId
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });

  if (updateContent.parentId === null || typeof updateContent.parentId === 'string') {
    const updatedPage = await setupPermissionsAfterPageRepositioned(pageId);
    return res.status(200).json(updatedPage);
  }

  // Keeping the corresponding block in sync
  if (pageWithPermission.type === 'card') {
    await prisma.block.update({
      where: {
        id: pageWithPermission.id
      },
      data: {
        updatedAt: new Date(),
        updatedBy: userId
      }
    });
  }

  return res.status(200).json(pageWithPermission);
}

async function deletePage (req: NextApiRequest, res: NextApiResponse<ModifyChildPagesResponse>) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  if (permissions.delete !== true) {
    throw new ActionNotPermittedError('You are not allowed to delete this page.');
  }

  const rootBlock = await prisma.block.findUnique({
    where: {
      id: pageId
    }
  });

  const modifiedChildPageIds = await modifyChildPages(pageId, userId, 'delete');

  return res.status(200).json({ pageIds: modifiedChildPageIds, rootBlock });
}

export default withSessionRoute(handler);
