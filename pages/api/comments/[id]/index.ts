
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .put(requireKeys(['content'], 'body'), editComment)
  .delete(deleteComment);

async function editComment (req: NextApiRequest, res: NextApiResponse) {
  const { content } = req.body as {
    content: string,
  };

  const commentId = req.query.id as string;

  const comment = await prisma.comment.update({
    where: {
      id: commentId
    },
    data: {
      content
    }
  });

  return res.status(200).json(comment);
}

async function deleteComment (req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id;
  await prisma.comment.deleteMany({
    where: {
      id: req.query.id as string,
      userId
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
