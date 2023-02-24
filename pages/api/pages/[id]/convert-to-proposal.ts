import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import type { IPageWithPermissions } from 'lib/pages';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { computeProposalCategoryPermissions } from 'lib/permissions/proposals/computeProposalCategoryPermissions';
import { createProposal } from 'lib/proposal/createProposal';
import { disconnectProposalChildren } from 'lib/proposal/disconnectProposalChildren';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['categoryId'], 'body'))
  .post(convertToProposal);

async function convertToProposal(req: NextApiRequest, res: NextApiResponse<IPageWithPermissions>) {
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

  const categoryId = req.body.categoryId;

  const proposalPermissions = await computeProposalCategoryPermissions({
    resourceId: categoryId,
    userId
  });

  if (!proposalPermissions.create_proposal) {
    throw new UnauthorisedActionError('You do not have permission to create a proposal in this category');
  }

  const { page: updatedPage } = await createProposal({
    pageId: page.id,
    userId,
    spaceId: page.spaceId,
    categoryId: req.body.categoryId as string,
    pageProps: {
      content: page.content ?? undefined,
      title: page.title
    }
  });

  // Launch this job in the background
  disconnectProposalChildren({
    pageId: updatedPage.id
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
