
import type { Page, Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import log from 'lib/log';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { logFirstProposal, logFirstUserPageCreation, logFirstWorkspacePageCreation } from 'lib/metrics/postToDiscord';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { checkIsContentEmpty } from 'lib/pages/checkIsContentEmpty';
import type { IPageWithPermissions } from 'lib/pages/server';
import { getPage, PageNotFoundError, resolvePageTree } from 'lib/pages/server';
import { createPage } from 'lib/pages/server/createPage';
import { setupPermissionsAfterPageCreated } from 'lib/permissions/pages';
import { computeSpacePermissions } from 'lib/permissions/spaces';
import { createProposal } from 'lib/proposal/createProposal';
import { syncProposalPermissions } from 'lib/proposal/syncProposalPermissions';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError, UnauthorisedActionError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';
import type { PageContent } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createPageHandler);

async function createPageHandler (req: NextApiRequest, res: NextApiResponse<IPageWithPermissions>) {
  const data = req.body as Prisma.PageUncheckedCreateInput;

  const spaceId = data.spaceId;

  if (!spaceId) {
    throw new InvalidInputError('A space id is required to create a page');
  }

  const { id: userId } = req.session.user;

  const permissions = await computeSpacePermissions({
    allowAdminBypass: true,
    resourceId: spaceId,
    userId
  });

  if (data.type === 'proposal' && !permissions.createVote) {
    throw new UnauthorisedActionError('You do not have permission to create a page in this space');
  }
  else if (data.type !== 'proposal' && !permissions.createPage) {
    throw new UnauthorisedActionError('You do not have permissions to create a page.');
  }

  data.hasContent = !checkIsContentEmpty(data.content as PageContent);

  // Remove parent ID and pass it to the creation input
  // This became necessary after adding a formal parentPage relation related to page.parentId
  // We now need to specify this as a ParentPage.connect prisma argument instead of a raw string
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdBy, spaceId: droppedSpaceId, ...pageCreationData } = data;

  let page: Page;

  if (pageCreationData.type === 'proposal_template') {
    throw new UnauthorisedActionError('You cannot create a proposal template using this endpoint.');
  }
  else if (pageCreationData.type === 'proposal') {
    ({ page } = await createProposal({
      ...pageCreationData,
      spaceId,
      createdBy
    }));
  }
  else {
    page = await createPage({ data: {
      spaceId,
      createdBy,
      ...pageCreationData
    } });
  }

  try {

    const proposalIdForPermissions = page.parentId ? (await resolvePageTree({
      pageId: page.id
      // includeDeletedPages: true
    })).parents.find(p => p.type === 'proposal')?.id : undefined;

    // Create proposal method provisions proposal permissions, so we only need this operation for child pages of a proposal
    if (proposalIdForPermissions) {
      await syncProposalPermissions({ proposalId: proposalIdForPermissions as string });
    }
    else if (page.type !== 'proposal') {
      await setupPermissionsAfterPageCreated(page.id);
    }

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

    relay.broadcast({
      type: 'pages_created',
      payload: [newPageToNotify]
    }, page.spaceId);

    res.status(201).json(pageWithPermissions);
  }
  catch (error) {

    log.warn('Deleting page because page permissions failed. TODO: create permissions with page in one transaction', { error });
    await prisma.page.delete({ where: { id: page.id } });

    throw error;
  }
}

export default withSessionRoute(handler);
