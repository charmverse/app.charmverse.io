import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(markTasksHandler);

async function markTasksHandler(req: NextApiRequest, res: NextApiResponse<{ ok: boolean }>) {
  const notificationIds = req.body as string[];

  await prisma.userNotificationMetadata.updateMany({
    where: {
      id: {
        in: notificationIds
      }
    },
    data: {
      seenAt: new Date(),
      channel: 'webapp'
    }
  });

  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
