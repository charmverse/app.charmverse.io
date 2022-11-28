import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import type { IPageWithPermissions } from 'lib/pages';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { computeSpacePermissions } from 'lib/permissions/spaces';
import { createProposal } from 'lib/proposal/createProposal';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(updatePageHandler);

async function updatePageHandler(req: NextApiRequest, res: NextApiResponse<IPageWithPermissions>) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;

  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      id: true,
      parentId: true,
      type: true,
      spaceId: true,
      content: true,
      title: true
    }
  });

  if (!page) {
    throw new NotFoundError();
  }

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  if (permissions.edit_content !== true) {
    throw new ActionNotPermittedError('You do not have permission to update this page');
  }

  const spacePermissions = await computeSpacePermissions({
    allowAdminBypass: true,
    resourceId: page.spaceId,
    userId
  });

  if (!spacePermissions.createVote) {
    throw new UnauthorisedActionError('You do not have permission to create a page in this space');
  }

  const { page: updatedPage } = await createProposal({
    id: page.id,
    createdBy: userId,
    spaceId: page.spaceId,
    content: page.content ?? undefined,
    title: page.title
  });

  updateTrackPageProfile(updatedPage.id);

  const updatedPageData = {
    id: updatedPage.id,
    spaceId: updatedPage.spaceId,
    proposalId: updatedPage.proposalId,
    type: updatedPage.type
  };

  relay.broadcast(
    {
      type: 'pages_meta_updated',
      payload: [updatedPageData]
    },
    page.spaceId
  );

  return res.status(200);
}

export default withSessionRoute(handler);
