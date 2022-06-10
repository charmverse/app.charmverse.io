
import { prisma } from 'db';
import { onError, onNoMatch } from 'lib/middleware';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getThread);

async function getThread (req: NextApiRequest, res: NextApiResponse) {
  const applicationId = req.query.id as string;

  const thread = await prisma.thread.findFirst({
    where: {
      applicationId
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

  return res.status(200).json(thread);
}

export default handler;
