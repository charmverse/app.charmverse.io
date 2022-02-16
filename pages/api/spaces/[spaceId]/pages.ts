
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { Page } from '@prisma/client';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getPages);

async function getPages (req: NextApiRequest, res: NextApiResponse<Page[]>) {
  const pages = await prisma.page.findMany({
    where: {
      spaceId: req.query.spaceId as string
    }
  });
  return res.status(200).json(pages);
}

export default withSessionRoute(handler);
