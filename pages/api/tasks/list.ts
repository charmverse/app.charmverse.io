import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { getPendingGnosisTasks, GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
import { MentionedTasks } from 'lib/mentions/interfaces';
import { getMentionedTasks } from 'lib/mentions/getMentionedTasks';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getTasks);

export interface GetTasksResponse {
  gnosis: GnosisSafeTasks[];
  mentioned: MentionedTasks[]
}

async function getTasks (req: NextApiRequest, res: NextApiResponse<GetTasksResponse>) {
  const gnosisTasks = await getPendingGnosisTasks(req.session.user.id);
  const mentionedTasks = await getMentionedTasks(req.session.user.id);
  return res.status(200).json({ gnosis: gnosisTasks, mentioned: mentionedTasks });
}

export default withSessionRoute(handler);
