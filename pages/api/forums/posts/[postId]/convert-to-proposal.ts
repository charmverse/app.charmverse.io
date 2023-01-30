import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import type { IPageWithPermissions } from 'lib/pages';
import { computeSpacePermissions } from 'lib/permissions/spaces';
import { createProposal } from 'lib/proposal/createProposal';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(convertToProposal);

async function convertToProposal(req: NextApiRequest, res: NextApiResponse<IPageWithPermissions>) {
  const postId = req.query.postId as string;
  const userId = req.session.user.id;

  const post = await prisma.post.findUnique({
    where: {
      id: postId
    },
    select: {
      id: true,
      spaceId: true,
      content: true,
      title: true,
      createdBy: true
    }
  });

  if (!post) {
    throw new NotFoundError();
  }

  if (post.createdBy !== userId) {
    throw new ActionNotPermittedError('You do not have permission to update this page');
  }

  const spacePermissions = await computeSpacePermissions({
    allowAdminBypass: true,
    resourceId: post.spaceId,
    userId
  });

  if (!spacePermissions.createVote) {
    throw new UnauthorisedActionError('You do not have permission to create a page in this space');
  }

  const { page: updatedPage } = await createProposal({
    createdBy: userId,
    spaceId: post.spaceId,
    content: post.content ?? undefined,
    title: post.title
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
    post.spaceId
  );

  return res.status(200);
}

export default withSessionRoute(handler);
