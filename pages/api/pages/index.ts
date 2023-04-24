import { prisma } from '@charmverse/core';
import type { Page, Prisma } from '@charmverse/core/dist/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import log from 'lib/log';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { logFirstProposal, logFirstUserPageCreation, logFirstWorkspacePageCreation } from 'lib/metrics/postToDiscord';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { modifyChildPages } from 'lib/pages/modifyChildPages';
import type { IPageWithPermissions, ModifyChildPagesResponse } from 'lib/pages/server';
import { createPage } from 'lib/pages/server/createPage';
import { PageNotFoundError } from 'lib/pages/server/errors';
import { getPage } from 'lib/pages/server/getPage';
import { computeUserPagePermissions, setupPermissionsAfterPageCreated } from 'lib/permissions/pages';
import { computeSpacePermissions } from 'lib/permissions/spaces';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError, UnauthorisedActionError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createPageHandler).delete(deletePages);

async function createPageHandler(req: NextApiRequest, res: NextApiResponse<IPageWithPermissions>) {
  const data = req.body as Prisma.PageUncheckedCreateInput;

  const spaceId = data.spaceId;

  if (!spaceId) {
    throw new InvalidInputError('A space id is required to create a page');
  }

  if (data.type.match('proposal')) {
    throw new InvalidInputError('You cannot create a proposal or proposal template using this endpoint');
  }

  const { id: userId } = req.session.user;

  // When creating a nested page, check that a user can edit the parent page
  if (data.parentId) {
    const permissions = await computeUserPagePermissions({
      resourceId: data.parentId,
      userId
    });

    if (!permissions.edit_content) {
      throw new UnauthorisedActionError('You do not have permissions to create a page.');
    }
  } else {
    const permissions = await computeSpacePermissions({
      resourceId: spaceId,
      userId
    });

    if (!permissions.createPage) {
      throw new UnauthorisedActionError('You do not have permissions to create a page.');
    }
  }
  // Remove parent ID and pass it to the creation input
  // This became necessary after adding a formal parentPage relation related to page.parentId
  // We now need to specify this as a ParentPage.connect prisma argument instead of a raw string
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdBy, spaceId: droppedSpaceId, ...pageCreationData } = data;

  const page: Page = await createPage({
    data: {
      spaceId,
      createdBy,
      ...pageCreationData
    }
  });

  try {
    await setupPermissionsAfterPageCreated(page.id);

    const pageWithPermissions = await getPage(page.id);

    if (!pageWithPermissions) {
      throw new PageNotFoundError(page.id);
    }

    logFirstWorkspacePageCreation(page);
    logFirstUserPageCreation(page);

    if (page.type === 'proposal') {
      logFirstProposal({
        userId,
        spaceId
      });
    }

    updateTrackPageProfile(page.id);
    trackUserAction('create_page', { userId, spaceId, pageId: page.id, type: page.type });

    const { content, contentText, ...newPageToNotify } = pageWithPermissions;
    relay.broadcast(
      {
        type: 'pages_created',
        payload: [newPageToNotify]
      },
      page.spaceId
    );

    res.status(201).json(pageWithPermissions);
  } catch (error) {
    log.warn('Deleting page because page permissions failed. TODO: create permissions with page in one transaction', {
      error
    });
    await prisma.page.delete({ where: { id: page.id } });

    throw error;
  }
}

async function deletePages(req: NextApiRequest, res: NextApiResponse) {
  const pageIds = (req.body || []) as string[];
  const userId = req.session.user.id;

  for (const pageId of pageIds) {
    const permissions = await computeUserPagePermissions({
      resourceId: pageId,
      userId
    });

    if (permissions.delete !== true) {
      throw new ActionNotPermittedError('You are not allowed to delete this page.');
    }
  }

  const pagesToDelete = await prisma.page.findMany({
    where: {
      id: {
        in: pageIds
      }
    },
    select: {
      id: true,
      spaceId: true
    }
  });

  const spaceIds = [...new Set(pagesToDelete.map((p) => p.spaceId).filter(isTruthy))];

  // A user can delete only a batch of pages from a single space
  if (spaceIds.length > 1) {
    throw new ActionNotPermittedError("You can't delete pages from multiple spaces at once");
  }

  const spaceId = spaceIds[0];

  const modifiedChildPageIds: string[] = [];
  for (const pageToDelete of pagesToDelete) {
    const childPageIds = await modifyChildPages(pageToDelete.id, userId, 'delete');
    modifiedChildPageIds.push(...childPageIds);
    updateTrackPageProfile(pageToDelete.id);
    trackUserAction('delete_page', { userId, pageId: pageToDelete.id, spaceId: pageToDelete.spaceId });
  }

  log.info('User deleted pages', {
    userId,
    pageIds,
    childPageIds: modifiedChildPageIds,
    spaceId
  });

  return res.status(200).end();
}

export default withSessionRoute(handler);
