import { PageNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CommentCreate } from 'lib/comments';
import { addComment } from 'lib/comments';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { publishInlineCommentEvent } from 'lib/notifications/publishInlineCommentEvent';
import { getPermissionsClient } from 'lib/permissions/api';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';

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

  const permissionSet = await getPermissionsClient({
    resourceId: thread.pageId,
    resourceIdType: 'page'
  }).then(({ client }) =>
    client.pages.computePagePermissions({
      resourceId: thread.pageId,
      userId
    })
  );

  if (!permissionSet.comment) {
    throw new ActionNotPermittedError();
  }

  const createdComment = await addComment({
    threadId,
    userId,
    content
  });

  await publishInlineCommentEvent({
    inlineCommentId: createdComment.id,
    page,
    userId
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
