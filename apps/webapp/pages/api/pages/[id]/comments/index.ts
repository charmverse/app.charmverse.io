import { prisma } from '@charmverse/core/prisma-client';
import type { CreateCommentInput } from '@packages/lib/comments';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';
import { publishDocumentEvent } from '@packages/lib/webhookPublisher/publishEvent';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import { createPageComment } from '@packages/pages/comments/createPageComment';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { PageCommentWithVote } from 'lib/pages/comments/interface';
import { listPageComments } from 'lib/pages/comments/listPageComments';
import { PageNotFoundError } from 'lib/pages/server';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(listPageCommentsHandler).use(requireUser).post(createPageCommentHandler);

async function listPageCommentsHandler(req: NextApiRequest, res: NextApiResponse<PageCommentWithVote[]>) {
  const { id: pageId } = req.query as any as { id: string };

  const userId = req.session.user?.id;

  const permissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (permissions.read !== true) {
    throw new ActionNotPermittedError('You do not have permission to view comments');
  }

  const pageCommentsWithVotes = await listPageComments({ pageId, userId });

  res.status(200).json(pageCommentsWithVotes);
}

async function createPageCommentHandler(req: NextApiRequest, res: NextApiResponse<PageCommentWithVote>) {
  const { id: pageId } = req.query as any as { id: string };
  const body = req.body as CreateCommentInput;
  const userId = req.session.user.id;

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { spaceId: true, type: true, proposalId: true }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  const permissions = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (permissions.comment !== true) {
    throw new ActionNotPermittedError('You do not have permission to comment on this page');
  }

  const pageComment = await createPageComment({ pageId, userId, ...body });

  await publishDocumentEvent({
    documentId: pageId,
    scope: WebhookEventNames.DocumentCommentCreated,
    commentId: pageComment.id,
    spaceId: page.spaceId
  });

  res.status(200).json({
    ...pageComment,
    upvoted: null,
    upvotes: 0,
    downvotes: 0
  });
}

export default withSessionRoute(handler);
