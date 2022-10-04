import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { MentionedTasksGroup } from 'lib/mentions/getMentionedTasks';
import { getMentionedTasks } from 'lib/mentions/getMentionedTasks';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { ProposalTask } from 'lib/proposal/getProposalTasks';
import { getProposalTasks } from 'lib/proposal/getProposalTasks';
import { withSessionRoute } from 'lib/session/withSession';
import { getVoteTasks } from 'lib/votes/getVoteTasks';
import type { VoteTask } from 'lib/votes/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getTasks);

export interface GetTasksResponse {
  mentioned: MentionedTasksGroup;
  votes: VoteTask[];
  proposals: {
    marked: ProposalTask[];
    unmarked: ProposalTask[];
  };
}

async function getTasks (req: NextApiRequest, res: NextApiResponse<GetTasksResponse>) {
  const userId = req.session.user.id;
  const mentionedTasksGroup = await getMentionedTasks(userId);
  const voteTasks = await getVoteTasks(userId);
  const proposalTasks = await getProposalTasks(userId);
  return res.status(200).json({ proposals: proposalTasks, votes: voteTasks, mentioned: mentionedTasksGroup });
}

export default withSessionRoute(handler);
