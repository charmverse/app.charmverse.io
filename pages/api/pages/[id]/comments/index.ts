import { prisma } from '@charmverse/core/prisma-client';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CreateCommentInput } from 'lib/comments';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { createPageComment } from 'lib/pages/comments/createPageComment';
import type { PageCommentWithVote } from 'lib/pages/comments/interface';
import { listPageComments } from 'lib/pages/comments/listPageComments';
import { PageNotFoundError } from 'lib/pages/server';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { withSessionRoute } from 'lib/session/withSession';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishDocumentEvent } from 'lib/webhookPublisher/publishEvent';

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
