
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { NotFoundError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { prisma } from 'db';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';
import { PageContent } from 'models';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { deleteComment, updateComment } from 'lib/comments';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .delete(deleteCommentController)
  .put(requireKeys(['content'], 'body'), updateCommentController);

async function updateCommentController (req: NextApiRequest, res: NextApiResponse) {
  const { content } = req.body as {
    content: PageContent,
  };

  const commentId = req.query.id as string;
  const userId = req.session.user.id;
  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      userId
    },
    select: {
      thread: {
        select: {
          pageId: true
        }
      }
    }
  });

  if (!comment) {
    throw new NotFoundError();
  }

  const permissionSet = await computeUserPagePermissions({
    pageId: comment.thread.pageId,
    userId
  });

  if (!permissionSet.edit_content) {
    return res.status(401).json({
      error: 'You are not allowed to perform this action'
    });
  }

  await prisma.comment.updateMany({
    where: {
      id: commentId,
      userId: req.session.user.id as string
    },
    data: {
      content,
      updatedAt: new Date()
    }
  });

  return res.status(200).json({
    ...comment,
    content
  });
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
