import { PageNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { CommentCreate } from '@packages/lib/comments';
import { addComment } from '@packages/lib/comments';
import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';
import { publishDocumentEvent } from '@packages/lib/webhookPublisher/publishEvent';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import { DataNotFoundError } from '@packages/utils/errors';
import { relay } from '@packages/websockets/relay';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(requireKeys(['content', 'threadId'], 'body'), addCommentController);

async function addCommentController(req: NextApiRequest, res: NextApiResponse) {
  const { threadId, content } = req.body as CommentCreate;
  const userId = req.session.user.id;

  const thread = await prisma.thread.findUnique({
    where: {
      id: threadId
    },
    select: {
      pageId: true,
      spaceId: true
    }
  });

  if (!thread) {
    throw new DataNotFoundError(`Thread with id ${threadId} not found`);
  }

  const pageId = thread.pageId;

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { spaceId: true, createdBy: true, type: true, bountyId: true, proposalId: true, cardId: true, id: true }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  const permissionSet = await permissionsApiClient.pages.computePagePermissions({
    resourceId: thread.pageId,
    userId
  });

  if (!permissionSet.comment) {
    throw new ActionNotPermittedError();
  }

  const createdComment = await addComment({
    threadId,
    userId,
    content
  });

  await publishDocumentEvent({
    documentId: page.id,
    scope: WebhookEventNames.DocumentInlineCommentCreated,
    inlineCommentId: createdComment.id,
    spaceId: page.spaceId
  });

  trackUserAction('page_comment_created', {
    pageId: thread.pageId,
    userId,
    spaceId: thread.spaceId
  });

  relay.broadcast(
    {
      type: 'threads_updated',
      payload: {
        pageId: thread.pageId,
        threadId
      }
    },
    thread.spaceId
  );

  return res.status(201).json(createdComment);
}

export default withSessionRoute(handler);
