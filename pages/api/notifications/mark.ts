import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { MarkNotifications } from 'lib/notifications/markNotifications';
import { markNotifications } from 'lib/notifications/markNotifications';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(markNotificationsHandler);

async function markNotificationsHandler(req: NextApiRequest, res: NextApiResponse<{ ok: boolean }>) {
  const { ids, state } = req.body as MarkNotifications;
  await markNotifications({ ids, state });
  return res.status(200).end();
}

export default withSessionRoute(handler);
