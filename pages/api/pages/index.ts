import type { Page, Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import log from 'lib/log';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { logFirstProposal, logFirstUserPageCreation, logFirstWorkspacePageCreation } from 'lib/metrics/postToDiscord';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { IPageWithPermissions } from 'lib/pages/server';
import { createPage } from 'lib/pages/server/createPage';
import { PageNotFoundError } from 'lib/pages/server/errors';
import { getPage } from 'lib/pages/server/getPage';
import { setupPermissionsAfterPageCreated } from 'lib/permissions/pages';
import { computeSpacePermissions } from 'lib/permissions/spaces';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError, UnauthorisedActionError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createPageHandler);

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

  const permissions = await computeSpacePermissions({
    resourceId: spaceId,
    userId
  });

  if (!permissions.createPage) {
    throw new UnauthorisedActionError('You do not have permissions to create a page.');
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

export default withSessionRoute(handler);
