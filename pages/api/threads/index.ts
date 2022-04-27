
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { prisma } from 'db';
import { Thread } from '@prisma/client';
import { PageContent } from 'models';
import { ThreadWithComments } from '../pages/[id]/threads';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .post(requireKeys(['context', 'pageId', 'content'], 'body'), startThread);

export interface StartThreadRequest {
  content: PageContent,
  pageId: string,
  context: string
}

async function startThread (req: NextApiRequest, res: NextApiResponse<ThreadWithComments>) {

  const { content, context, pageId } = req.body as StartThreadRequest;

  const userId = req.session.user.id;

  const thread = await prisma.thread.create({
    data: {
      resolved: false,
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
    },
    include: {
      user: true
    }
  });

  return res.status(200).json({ ...thread, Comment: [comment] });
}

export default withSessionRoute(handler);
