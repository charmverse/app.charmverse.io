import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { MarkNotification } from 'lib/userNotifications/markNotifications';
import { markNotifications } from 'lib/userNotifications/markNotifications';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(markTasksHandler);

async function markTasksHandler(req: NextApiRequest, res: NextApiResponse<{ ok: boolean }>) {
  const tasks = req.body as MarkNotification[];
  await markNotifications(tasks);
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
