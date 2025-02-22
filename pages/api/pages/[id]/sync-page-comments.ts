import { prisma } from '@charmverse/core/prisma-client';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { PageCommentWithVote } from 'lib/pages/comments/interface';
import { syncPageCommentsWithLensPost } from 'lib/pages/comments/syncPageCommentsWithLensPost';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(syncProposalCommentsHandler);

async function syncProposalCommentsHandler(req: NextApiRequest, res: NextApiResponse<PageCommentWithVote[]>) {
  const { id: pageId } = req.query as any as { id: string };

  const userId = req.session.user?.id;

  const permissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (permissions.read !== true) {
    throw new ActionNotPermittedError('You do not have permission to view this page');
  }

  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      type: true,
      spaceId: true,
      lensPostLink: true
    }
  });

  const lensPostLink = page?.lensPostLink;
  if (!lensPostLink || page.type !== 'proposal') {
    throw new Error("Proposal not found or it hasn't been posted in Lens yet");
  }

  const pageCommentsWithVotes = await syncPageCommentsWithLensPost({
    spaceId: page.spaceId,
    pageId,
    lensPostLink,
    userId
  });

  res.status(200).json(pageCommentsWithVotes);
}

export default withSessionRoute(handler);
