
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { prisma } from 'db';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';
import { CommentCreate, addComment } from 'lib/comments';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .post(requireKeys(['content', 'threadId'], 'body'), addCommentController);

async function addCommentController (req: NextApiRequest, res: NextApiResponse) {
  const { threadId, content } = req.body as CommentCreate;
  const userId = req.session.user.id;

  const thread = await prisma.thread.findUnique({
    where: {
      id: threadId
    },
    select: {
      pageId: true
    }
  });

  if (!thread) {
    throw new DataNotFoundError(`Thread with id ${threadId} not found`);
  }

  if (thread.pageId) {
    const permissionSet = await computeUserPagePermissions({
      pageId: thread.pageId,
      userId,
      allowAdminBypass: false
    });

    if (!permissionSet.comment) {
      throw new ActionNotPermittedError();
    }
  }

  const createdComment = await addComment({
    threadId,
    userId,
    content
  });

  return res.status(201).json(createdComment);
}

export default withSessionRoute(handler);
