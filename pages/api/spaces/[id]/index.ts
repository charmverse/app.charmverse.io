
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { Space } from '@prisma/client';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(updateSpace).delete(deleteSpace);

async function updateSpace (req: NextApiRequest, res: NextApiResponse<Space>) {

  const space = await prisma.space.update({
    where: {
      id: req.query.id as string
    },
    data: req.body
  });
  return res.status(200).json(space);
}

async function deleteSpace (req: NextApiRequest, res: NextApiResponse) {
  await prisma.space.delete({
    where: {
      id: req.query.id as string
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
