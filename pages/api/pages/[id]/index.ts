
import type { Page } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { trackPageAction } from 'lib/metrics/mixpanel/trackPageAction';
import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { ActionNotPermittedError, hasAccessToSpace, NotFoundError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import type { IPageWithPermissions, ModifyChildPagesResponse } from 'lib/pages';
import { modifyChildPages } from 'lib/pages/modifyChildPages';
import { resolvePageTree } from 'lib/pages/server';
import { getPage } from 'lib/pages/server/getPage';
import { updatePage } from 'lib/pages/server/updatePage';
import { computeUserPagePermissions, setupPermissionsAfterPageRepositioned } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import { UndesirableOperationError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireKeys(['id'], 'query'))
  .get(getPageRoute)
  // Only require user on update and delete
  .use(requireUser)
  .put(updatePageHandler)
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

async function updatePageHandler (req: NextApiRequest, res: NextApiResponse<IPageWithPermissions>) {

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

  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      id: true,
      parentId: true,
      type: true,
      spaceId: true
    }
  });

  if (!page) {
    throw new NotFoundError();
  }

  // Only admins can edit proposal template content
  if (page.type === 'proposal_template') {
    const { error } = await hasAccessToSpace({
      spaceId: page.spaceId,
      userId,
      adminOnly: true
    });

    if (error) {
      throw error;
    }
  }

  const hasNewParentPage = (updateContent.parentId !== page.parentId && (typeof updateContent.parentId === 'string' || updateContent.parentId === null));

  // Only perform validation if repositioning below another page
  if (hasNewParentPage && typeof updateContent.parentId === 'string') {
    const { flatChildren } = await resolvePageTree({
      pageId,
      flattenChildren: true
    });

    const newParentId = updateContent.parentId as string;

    if (newParentId === pageId || flatChildren.some(p => p.id === newParentId)) {
      throw new UndesirableOperationError(`You cannot reposition a page to be a child of ${newParentId === pageId ? 'itself' : 'one of its child pages'}`);
    }
  }

  const pageWithPermission = await updatePage(page, userId, req.body);

  if (hasNewParentPage) {
    const updatedPage = await setupPermissionsAfterPageRepositioned(pageId);
    return res.status(200).json(updatedPage);
  }

  // Update page track profile, unless it was content update
  if (!('content' in updateContent)) {
    updateTrackPageProfile(pageWithPermission.id);
  }

  const { content, contentText, ...updatedPageMeta } = req.body as Page;

  relay.broadcast({
    type: 'pages_meta_updated',
    payload: [{ ...updatedPageMeta, id: pageId }]
  }, page.spaceId);

  return res.status(200).json(pageWithPermission);
}

async function deletePage (req: NextApiRequest, res: NextApiResponse<ModifyChildPagesResponse>) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const pageToDelete = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      spaceId: true
    }
  });

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

  trackPageAction('delete_page', { userId, pageId });
  updateTrackPageProfile(pageId);

  if (pageToDelete) {
    relay.broadcast({
      type: 'pages_deleted',
      payload: modifiedChildPageIds.map(id => ({ id }))
    }, pageToDelete?.spaceId as string);
  }

  return res.status(200).json({ pageIds: modifiedChildPageIds, rootBlock });
}

export default withSessionRoute(handler);
