
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .get(getComments);

async function getComments (req: NextApiRequest, res: NextApiResponse) {
  const pageId = req.query.id as string;

  const comments = await prisma.comment.findMany({
    where: {
      pageId
    },
    include: {
      user: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return res.status(200).json(comments);
}

export default withSessionRoute(handler);
