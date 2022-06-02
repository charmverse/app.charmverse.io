import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { getPendingGnosisTasks, GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
import { prisma } from 'db';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getTasks);

export interface GetTasksResponse {
  gnosis: GnosisSafeTasks[];
}

async function getTasks (req: NextApiRequest, res: NextApiResponse<GetTasksResponse>) {

  const tasks = await getPendingGnosisTasks(req.session.user.id);

  return res.status(200).json({ gnosis: tasks });
}

export default withSessionRoute(handler);
