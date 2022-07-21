
import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeUserPagePermissions, setupPermissionsAfterPageRepositioned } from 'lib/permissions/pages';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { withSessionRoute } from 'lib/session/withSession';
import { Page, PageType } from '@prisma/client';
import { prisma } from 'db';
import { modifyChildPages } from 'lib/pages/modifyChildPages';
import { IPageWithPermissions, ModifyChildPagesResponse } from 'lib/pages';
import { getPage } from 'lib/pages/server/getPage';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireKeys(['id'], 'query'))
  .get(getPageRoute)
  // Only require user on update and delete
  .use(requireUser)
  .put(updatePage)
  .delete(deletePage);

async function getPageRoute (req: NextApiRequest, res: NextApiResponse<IPageWithPermissions>) {
  const pageId = req.query.id as string;
  const userId = req.session?.user?.id;

  const page = await getPage(pageId, req.query.spaceId as string | undefined);

  if (!page) {
    throw new NotFoundError();
  }

  // Page ID might be a path now, so first we fetch the page and if found, can pass the id from the found page to check if we should actually send it to the requester
  const permissions = await computeUserPagePermissions({
    pageId: page.id,
    userId
  });

  if (permissions.read !== true) {
    throw new ActionNotPermittedError('You do not have permission to view this page');
  }

  return res.status(200).json(page);
}

async function updatePage (req: NextApiRequest, res: NextApiResponse<IPageWithPermissions>) {

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
  // Allow user with View & Comment permission to edit the page content
  // This is required as in order to create a comment, the page needs to be updated
  else if (permissions.edit_content !== true && permissions.comment !== true) {
    throw new ActionNotPermittedError('You do not have permission to update this page');
  }

  const page = await getPage(pageId);

  if (!page) {
    throw new NotFoundError();
  }

  const isBountyPage = page.type === PageType.bounty;

  const pageUpdateData = {
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
  };

  let pageWithPermission;

  if (isBountyPage) {
    [pageWithPermission] = await prisma.$transaction([
      prisma.page.update(pageUpdateData),
      prisma.bounty.update({
        where: {
          id: page.bountyId || undefined
        },
        data: {
          title: req.body.title,
          description: req.body.contentText,
          descriptionNodes: req.body.content as string
        }
      })
    ]);
  }
  else {
    pageWithPermission = prisma.page.update(pageUpdateData);
  }

  if (updateContent.parentId === null || typeof updateContent.parentId === 'string') {
    const updatedPage = await setupPermissionsAfterPageRepositioned(pageId);
    return res.status(200).json(updatedPage);
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
