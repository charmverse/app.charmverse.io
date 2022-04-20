
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { prisma } from 'db';
import { Thread } from '@prisma/client';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .get(getThreads);

export type ThreadWithComments = Thread & {Comment: Comment[]}

async function getThreads (req: NextApiRequest, res: NextApiResponse) {
  const pageId = req.query.id as string;

  const threads = await prisma.thread.findMany({
    where: {
      pageId
    },
    include: {
      Comment: true
    }
  });

  return res.status(200).json(threads);
}

export default withSessionRoute(handler);
