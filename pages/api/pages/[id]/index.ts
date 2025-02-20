import { log } from '@charmverse/core/log';
import { resolvePageTree } from '@charmverse/core/pages';
import type { Page } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { replaceS3Domain } from '@packages/utils/url';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import type { TrashOrDeletePageResponse, PageWithContent, PageMetaLite } from 'lib/pages/interfaces';
import { generatePageQuery } from 'lib/pages/server/generatePageQuery';
import { updatePage } from 'lib/pages/server/updatePage';
import { trashOrDeletePage } from 'lib/pages/trashOrDeletePage';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { convertDoc } from 'lib/prosemirror/conversions/convertOldListNodes';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { UndesirableOperationError } from 'lib/utils/errors';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getPageRoute)
  // Only require user on update and delete
  .use(requireUser)
  .put(updatePageHandler)
  .delete(deletePage);

async function getPageRoute(req: NextApiRequest, res: NextApiResponse<PageWithContent | PageMetaLite>) {
  const {
    id: pageIdOrPath,
    spaceId: spaceIdOrDomain,
    meta
  } = req.query as { id: string; spaceId: string; meta?: string };
  const returnOnlyMeta = meta && meta !== 'false';
  const userId = req.session?.user?.id;
  const searchQuery = generatePageQuery({
    pageIdOrPath,
    spaceIdOrDomain
  });
  const page = await prisma.page.findFirst({
    where: searchQuery
  });

  if (!page) {
    throw new NotFoundError();
  }

  // Page ID might be a path now, so first we fetch the page and if found, can pass the id from the found page to check if we should actually send it to the requester
  const permissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: page.id,
    userId
  });

  if (!permissions.read) {
    throw new ActionNotPermittedError('You do not have permissions to view this page');
  }

  const result: PageWithContent = {
    ...page,
    permissionFlags: permissions
  };

  try {
    result.content = convertDoc(result.content)?.toJSON();
  } catch (error) {
    log.error('Could not convert page with old lists', { pageId: result.id, error });
  }

  result.galleryImage = replaceS3Domain(result.galleryImage);
  result.headerImage = replaceS3Domain(result.headerImage);
  result.icon = replaceS3Domain(result.icon);

  if (returnOnlyMeta) {
    const pageMeta: PageMetaLite = {
      id: result.id,
      title: result.title,
      hasContent: result.hasContent,
      type: result.type,
      icon: result.icon,
      path: result.path,
      isLocked: result.isLocked
    };
    return res.status(200).json(pageMeta);
  }

  return res.status(200).json(result);
}

async function updatePageHandler(req: NextApiRequest, res: NextApiResponse) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const permissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  const updateContent = (req.body ?? {}) as Partial<Page>;
  if (
    (typeof updateContent.index === 'number' || updateContent.parentId !== undefined) &&
    permissions.edit_position !== true
  ) {
    throw new ActionNotPermittedError('You do not have permission to reposition this page');
  } else if ((updateContent.icon || updateContent.headerImage || updateContent.title) && !permissions.edit_content) {
    throw new ActionNotPermittedError('You do not have permissions to edit the icon of this page');

    // Allow user with View & Comment permission to edit the page content
    // This is required as in order to create a comment, the page needs to be updated
  } else if (permissions.edit_content !== true && permissions.comment !== true) {
    throw new ActionNotPermittedError('You do not have permission to update this page');
  }

  const pageBeforeUpdate = await prisma.page.findUniqueOrThrow({
    where: {
      id: pageId
    },
    select: {
      id: true,
      parentId: true,
      type: true,
      spaceId: true,
      path: true,
      additionalPaths: true
    }
  });

  // Only admins can edit proposal template content
  if (pageBeforeUpdate.type === 'proposal_template') {
    const { error } = await hasAccessToSpace({
      spaceId: pageBeforeUpdate.spaceId,
      userId,
      adminOnly: true
    });

    if (error) {
      throw error;
    }
  }

  const hasNewParentPage =
    updateContent.parentId !== pageBeforeUpdate.parentId &&
    (typeof updateContent.parentId === 'string' || !updateContent.parentId);

  // Only perform validation if repositioning below another page
  if (hasNewParentPage && typeof updateContent.parentId === 'string') {
    const { flatChildren } = await resolvePageTree({
      pageId,
      flattenChildren: true
    });

    const newParentId = updateContent.parentId as string;

    if (newParentId === pageId || flatChildren.some((p) => p.id === newParentId)) {
      throw new UndesirableOperationError(
        `You cannot reposition a page to be a child of ${newParentId === pageId ? 'itself' : 'one of its child pages'}`
      );
    }
  }

  const updatedPage = await updatePage(pageBeforeUpdate, userId, req.body);

  const { content, contentText, ...updatedPageMeta } = updateContent;

  if (updatedPage.path !== pageBeforeUpdate.path) {
    updatedPageMeta.path = updatedPage.path;
  }

  updateTrackPageProfile(updatedPage.id);
  relay.broadcast(
    {
      type: 'pages_meta_updated',
      payload: [
        {
          ...updatedPageMeta,
          spaceId: pageBeforeUpdate.spaceId,
          id: pageId,
          updatedBy: userId,
          additionalPaths: pageBeforeUpdate.path !== updatedPage.path ? [pageBeforeUpdate.path] : undefined
        }
      ]
    },
    pageBeforeUpdate.spaceId
  );

  if (hasNewParentPage) {
    await permissionsApiClient.pages.setupPagePermissionsAfterEvent({
      event: 'repositioned',
      pageId
    });
  }

  log.info(`Update page success`, { pageId, userId });

  return res.status(200).send(updatedPage);
}

async function deletePage(req: NextApiRequest, res: NextApiResponse<TrashOrDeletePageResponse>) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const pageToDelete = await prisma.page.findUniqueOrThrow({
    where: {
      id: pageId
    },
    select: {
      spaceId: true
    }
  });

  const permissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (permissions.delete !== true) {
    throw new ActionNotPermittedError('You are not allowed to delete this page.');
  }

  const modifiedChildPageIds = await trashOrDeletePage(pageId, userId, 'delete');

  updateTrackPageProfile(pageId);

  relay.broadcast(
    {
      type: 'pages_deleted',
      payload: modifiedChildPageIds.map((id) => ({ id }))
    },
    pageToDelete.spaceId
  );

  relay.broadcast(
    {
      type: 'blocks_deleted',
      payload: modifiedChildPageIds.map((id) => ({ id }))
    },
    pageToDelete.spaceId
  );

  trackUserAction('delete_page', { userId, pageId, spaceId: pageToDelete.spaceId });

  log.info('User deleted a page', {
    userId,
    pageId,
    pageIds: modifiedChildPageIds,
    spaceId: pageToDelete.spaceId
  });

  return res.status(200).json({ pageIds: modifiedChildPageIds });
}

export default withSessionRoute(handler);
