
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import { prisma } from 'db';
import { Thread, Comment, User } from '@prisma/client';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getThreads);

export type CommentWithUser = (Comment & {
  user: User;
})

export type ThreadWithComments = Thread & {
  Comment: CommentWithUser[]
}

async function getThreads (req: NextApiRequest, res: NextApiResponse) {
  const pageId = req.query.id as string;

  const threads = await prisma.thread.findMany({
    where: {
      pageId
    },
    include: {
      Comment: {
        include: {
          user: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  return res.status(200).json(threads);
}

export default handler;
