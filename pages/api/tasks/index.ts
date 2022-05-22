import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { getPendingGnosisTasks, GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
import { prisma } from 'db';
import { User, UserGnosisSafeState } from '@prisma/client';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getTasks);

type UserWithGnosisSafeState = User & {
  gnosisSafeState: null | UserGnosisSafeState
}
export interface GetTasksResponse {
  gnosis: GnosisSafeTasks[]
  user: UserWithGnosisSafeState
}

async function getTasks (req: NextApiRequest, res: NextApiResponse<GetTasksResponse>) {
  const user = await prisma.user.findUnique({
    where: {
      id: req.session.user.id
    },
    include: {
      gnosisSafeState: true
    }
  }) as UserWithGnosisSafeState;

  const tasks = await getPendingGnosisTasks(req.session.user.id);
  return res.status(200).json({ gnosis: tasks, user });
}

export default withSessionRoute(handler);
