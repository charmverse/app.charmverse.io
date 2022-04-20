
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { requirePagePermissions } from 'lib/middleware/requirePagePermissions';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .post(requireKeys(['context', 'pageId', 'content'], 'body'), requirePagePermissions(['edit_content'], startThread))
  .delete(requirePagePermissions(['edit_content'], deleteThread));

async function startThread (req: NextApiRequest, res: NextApiResponse) {

  const { content, context, pageId } = req.body as {
    content: string,
    pageId: string,
    context: string
  };

  const userId = req.session.user.id;

  const thread = await prisma.thread.create({
    data: {
      context,
      page: {
        connect: {
          id: pageId
        }
      },
      user: {
        connect: {
          id: userId
        }
      }
    }
  });

  const comment = await prisma.comment.create({
    data: {
      content,
      thread: {
        connect: {
          id: thread.id
        }
      },
      user: {
        connect: {
          id: userId
        }
      }
    }
  });

  return res.status(200).json({
    comment,
    thread
  });
}

async function deleteThread (req: NextApiRequest, res: NextApiResponse) {
  await prisma.thread.delete({
    where: {
      id: req.query.id as string
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
