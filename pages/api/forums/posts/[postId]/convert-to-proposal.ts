import type { PageMeta } from '@charmverse/core/pages';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { convertPostToProposal } from 'lib/forums/posts/convertPostToProposal';
import { updateTrackPageProfile } from 'lib/metrics/mixpanel/updateTrackPageProfile';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { withSessionRoute } from 'lib/session/withSession';
import { UnauthorisedActionError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(convertToProposal);

async function convertToProposal(req: NextApiRequest, res: NextApiResponse<PageMeta>) {
  const postId = req.query.postId as string;
  const userId = req.session.user.id;

  const post = await prisma.post.findUniqueOrThrow({
    where: {
      id: postId
    },
    select: {
      id: true,
      spaceId: true,
      content: true,
      title: true,
      createdBy: true,
      proposalId: true,
      isDraft: true
    }
  });

  if (post.proposalId) {
    throw new ActionNotPermittedError("Post converted to proposal can't be edited");
  }

  if (post.isDraft) {
    throw new ActionNotPermittedError('Draft post cannot be converted to proposal');
  }

  const permissions = await permissionsApiClient.spaces.computeSpacePermissions({
    resourceId: post.spaceId,
    userId
  });

  if (!permissions.createProposals) {
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
