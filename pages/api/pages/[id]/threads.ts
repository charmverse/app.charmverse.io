
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getThreads);

async function getThreads (req: NextApiRequest, res: NextApiResponse) {
  const pageId = req.query.id as string;
  const computed = await computeUserPagePermissions({
    pageId,
    userId: req.session?.user?.id
  });

  if (computed.read !== true) {
    throw new NotFoundError('Page not found');
  }

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

export default withSessionRoute(handler);
