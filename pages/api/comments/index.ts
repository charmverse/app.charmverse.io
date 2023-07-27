import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CommentCreate } from 'lib/comments';
import { addComment } from 'lib/comments';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { getPermissionsClient } from 'lib/permissions/api';
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

  trackUserAction('page_comment_created', {
    pageId: thread.pageId,
    userId,
    spaceId: thread.spaceId
  });

  relay.broadcast(
    {
      type: 'inline_comment_created',
      payload: createdComment
    },
    thread.spaceId
  );

  return res.status(201).json(createdComment);
}

export default withSessionRoute(handler);
