
import { prisma } from 'db';
import { onError, onNoMatch } from 'lib/middleware';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getThreads);

async function getThreads (req: NextApiRequest, res: NextApiResponse) {
  const pageId = req.query.id as string;

  const threads = await prisma.thread.findMany({
    where: {
      pageId
    },
    include: {
      comments: {
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
