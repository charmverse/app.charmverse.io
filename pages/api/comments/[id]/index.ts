
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { NotFoundError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { prisma } from 'db';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';
import { PageContent } from 'models';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .put(requireKeys(['content'], 'body'), editComment)
  .delete(deleteComment);

async function editComment (req: NextApiRequest, res: NextApiResponse) {
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
      content
    }
  });

  return res.status(200).json({
    ...comment,
    content
  });
}

async function deleteComment (req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id;
  const comment = await prisma.comment.findFirst({
    where: {
      id: req.query.id as string,
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

  await prisma.comment.deleteMany({
    where: {
      id: req.query.id as string,
      userId
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
