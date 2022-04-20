
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { requirePagePermissions } from 'lib/middleware/requirePagePermissions';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .put(requireKeys(['content'], 'body'), requirePagePermissions(['edit_content'], editComment))
  .delete(requirePagePermissions(['edit_content'], deleteComment));

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
  await prisma.comment.delete({
    where: {
      id: req.query.id as string
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
