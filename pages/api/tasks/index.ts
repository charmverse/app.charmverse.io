import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Task } from 'models';
import { tasks } from './mocks';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getTasks);

async function getTasks (_req: NextApiRequest, res: NextApiResponse<Task[]>) {
  return res.status(200).json(tasks);
}

export default withSessionRoute(handler);
