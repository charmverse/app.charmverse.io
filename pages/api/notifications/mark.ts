import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { MarkNotification } from 'lib/notifications/markNotifications';
import { markNotifications } from 'lib/notifications/markNotifications';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(markTasksHandler);

async function markTasksHandler(req: NextApiRequest, res: NextApiResponse<{ ok: boolean }>) {
  const tasks = req.body as MarkNotification[];
  await markNotifications(tasks);
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
