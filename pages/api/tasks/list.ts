import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { getPendingGnosisTasks, GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
import { getMentionedTasks, MentionedTasksGroup } from 'lib/mentions/getMentionedTasks';
import { getVoteTasks } from 'lib/votes/getVoteTasks';
import { VoteTask } from 'lib/votes/interfaces';
import { getProposalTasks } from 'lib/proposal/getProposalTasks';
import type { ProposalTask } from 'lib/proposal/getProposalTasks';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getTasks);

export interface GetTasksResponse {
  gnosis: GnosisSafeTasks[];
  mentioned: MentionedTasksGroup
  votes: VoteTask[]
  proposals: ProposalTask[]
}

async function getTasks (req: NextApiRequest, res: NextApiResponse<GetTasksResponse>) {
  const userId = req.session.user.id;
  const gnosisTasks = await getPendingGnosisTasks(userId);
  const mentionedTasksGroup = await getMentionedTasks(userId);
  const voteTasks = await getVoteTasks(userId);
  const proposalTasks = await getProposalTasks(userId);
  return res.status(200).json({ proposals: proposalTasks, votes: voteTasks, gnosis: gnosisTasks, mentioned: mentionedTasksGroup });
}

export default withSessionRoute(handler);
