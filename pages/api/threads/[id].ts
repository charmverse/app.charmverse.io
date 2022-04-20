
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .delete(deleteThread)
  .put(updateThread);

async function deleteThread (req: NextApiRequest, res: NextApiResponse) {
  await prisma.thread.delete({
    where: {
      id: req.query.id as string
    }
  });
  return res.status(200).json({ ok: true });
}

export interface UpdateThreadRequest {
  resolved: boolean
}

async function updateThread (req: NextApiRequest, res: NextApiResponse) {
  await prisma.thread.update({
    where: {
      id: req.query.id as string
    },
    data: {
      resolved: req.body.resolved
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
