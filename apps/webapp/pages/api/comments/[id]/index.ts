import { prisma } from '@charmverse/core/prisma-client';
import type { PageContent } from '@packages/charmeditor/interfaces';
import { deleteComment, updateComment } from '@packages/lib/comments';
import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { DataNotFoundError, UnauthorisedActionError } from '@packages/utils/errors';
import { relay } from '@packages/websockets/relay';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .delete(deleteCommentController)
  .put(requireKeys(['content'], 'body'), updateCommentController);

async function updateCommentController(req: NextApiRequest, res: NextApiResponse) {
  const { content } = req.body as {
    content: PageContent;
  };

  const commentId = req.query.id as string;

  const userId = req.session.user.id;

  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId
    },
    select: {
      userId: true
    }
  });

  if (!comment) {
    throw new DataNotFoundError();
  }

  if (comment.userId !== userId) {
    throw new UnauthorisedActionError("You cannot edit another users' comment");
  }

  const commentAfterUpdate = await updateComment({
    content,
    id: commentId
  });

  relay.broadcast(
    {
      type: 'threads_updated',
      payload: {
        pageId: commentAfterUpdate.pageId,
        threadId: commentAfterUpdate.threadId
      }
    },
    commentAfterUpdate.spaceId
  );

  return res.status(200).json(commentAfterUpdate);
}

async function deleteCommentController(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id;

  const { id: commentId } = req.query;

  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId as string
    },
    select: {
      threadId: true,
      userId: true,
      spaceId: true,
      pageId: true
    }
  });

  if (!comment) {
    throw new DataNotFoundError();
  }

  if (comment.userId !== userId) {
    throw new UnauthorisedActionError("You cannot delete another users' comment");
  }

  await deleteComment(commentId as string);

  relay.broadcast(
    {
      type: 'threads_updated',
      payload: {
        pageId: comment.pageId,
        threadId: comment.threadId
      }
    },
    comment.spaceId
  );

  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
