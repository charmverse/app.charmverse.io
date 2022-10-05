
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(leaveWorkspace);

async function leaveWorkspace (req: NextApiRequest, res: NextApiResponse<{ ok: boolean }>) {
  const spaceId = req.query.id as string;
  const userId = req.session.user.id;
  await prisma.spaceRole.delete({
    where: {
      spaceUser: {
        spaceId,
        userId
      }
    }
  });

  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
