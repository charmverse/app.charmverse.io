import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getBountyTasks } from 'lib/bounties/getBountyTasks';
import type { BountyTasksGroup } from 'lib/bounties/getBountyTasks';
import type { MentionedTasksGroup } from 'lib/mentions/getMentionedTasks';
import { getMentionedTasks } from 'lib/mentions/getMentionedTasks';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { ProposalTasksGroup } from 'lib/proposal/getProposalTasks';
import { getProposalTasks } from 'lib/proposal/getProposalTasks';
import { withSessionRoute } from 'lib/session/withSession';
import { getVoteTasks } from 'lib/votes/getVoteTasks';
import type { VoteTask } from 'lib/votes/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getTasks);

export interface GetTasksResponse {
  mentioned: MentionedTasksGroup;
  votes: VoteTask[];
  proposals: ProposalTasksGroup;
  bounties: BountyTasksGroup;
}

async function getTasks (req: NextApiRequest, res: NextApiResponse<GetTasksResponse>) {
  const userId = req.session.user.id;
  const mentionedTasksGroup = await getMentionedTasks(userId);
  const voteTasks = await getVoteTasks(userId);
  const proposalTasks = await getProposalTasks(userId);
  const bountiesTasks = await getBountyTasks(userId);
  return res.status(200).json({ proposals: proposalTasks, votes: voteTasks, mentioned: mentionedTasksGroup, bounties: bountiesTasks });
}

export default withSessionRoute(handler);
