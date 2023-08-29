import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import type { PageCommentWithVote } from 'lib/pages/comments/interface';
import { syncPageComments } from 'lib/pages/comments/syncPageComments';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'page'
    })
  )
  .use(requireUser)
  .post(syncProposalCommentsHandler);

async function syncProposalCommentsHandler(req: NextApiRequest, res: NextApiResponse<PageCommentWithVote[]>) {
  const { id: pageId } = req.query as any as { id: string };

  const userId = req.session.user?.id;

  const permissions = await req.basePermissionsClient.pages.computePagePermissions({
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
      spaceId: true,
      proposal: {
        select: {
          lensPostLink: true
        }
      }
    }
  });

  const lensPostLink = page?.proposal?.lensPostLink;
  if (!lensPostLink) {
    throw new Error("Proposal not found or it hasn't been posted in Lens yet");
  }

  const pageCommentsWithVotes = await syncPageComments({ spaceId: page.spaceId, pageId, lensPostLink, userId });

  res.status(200).json(pageCommentsWithVotes);
}

export default withSessionRoute(handler);
