
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { deleteComment, updateComment } from 'lib/comments';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import type { PageContent } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .delete(deleteCommentController)
  .put(requireKeys(['content'], 'body'), updateCommentController);

async function updateCommentController (req: NextApiRequest, res: NextApiResponse) {
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
    throw new UnauthorisedActionError('You cannot edit another users\' comment');
  }

  const commentAfterUpdate = await updateComment({
    content,
    id: commentId
  });

  return res.status(200).json(commentAfterUpdate);
}

async function deleteCommentController (req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id;

  const { id: commentId } = req.query;

  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId as string
    },
    select: {
      userId: true
    }
  });

  if (!comment) {
    throw new DataNotFoundError();
  }

  if (comment.userId !== userId) {
    throw new UnauthorisedActionError('You cannot delete another users\' comment');
  }

  await deleteComment(commentId as string);

  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
