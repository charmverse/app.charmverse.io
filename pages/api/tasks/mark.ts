import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { MarkTask, markTasks } from 'lib/tasks/markTasks';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(markTasksHandler);

async function markTasksHandler (req: NextApiRequest, res: NextApiResponse<{ok: boolean}>) {
  const tasks = req.body as MarkTask[];
  await markTasks(tasks, req.session.user.id);
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
