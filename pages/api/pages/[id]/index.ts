
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { Page } from '@prisma/client';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updatePage).delete(deletePage);

async function updatePage (req: NextApiRequest, res: NextApiResponse<Page>) {

  const space = await prisma.page.update({
    where: {
      id: req.query.id as string
    },
    data: req.body
  });
  return res.status(200).json(space);
}

async function deletePage (req: NextApiRequest, res: NextApiResponse) {

  await prisma.page.delete({
    where: {
      id: req.query.id as string
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
