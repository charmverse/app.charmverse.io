import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { convertPostToProposal } from 'lib/forums/posts/convertPostToProposal';
import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import type { PageMeta } from 'lib/pages';
import { computeSpacePermissions } from 'lib/permissions/spaces';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(convertToProposal);

async function convertToProposal(req: NextApiRequest, res: NextApiResponse<PageMeta>) {
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
      createdBy: true,
      proposalId: true
    }
  });

  if (!post) {
    throw new NotFoundError();
  }

  if (post.proposalId) {
    throw new ActionNotPermittedError("Post converted to proposal can't be edited");
  }

  const spacePermissions = await computeSpacePermissions({
    allowAdminBypass: true,
    resourceId: post.spaceId,
    userId
  });

  if (!spacePermissions.createVote) {
    throw new UnauthorisedActionError('You do not have permission to create a page in this space');
  }

  const proposalPage = await convertPostToProposal({
    post,
    userId,
    content: post.content
  });

  updateTrackPageProfile(proposalPage.id);

  relay.broadcast(
    {
      type: 'pages_created',
      payload: [proposalPage]
    },
    post.spaceId
  );

  return res.status(200).json(proposalPage);
}

export default withSessionRoute(handler);
