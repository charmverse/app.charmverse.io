import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getBountyTasks } from 'lib/bounties/getBountyTasks';
import type { BountyTasksGroup } from 'lib/bounties/getBountyTasks';
import type { DiscussionTasksGroup } from 'lib/discussion/getDiscussionTasks';
import { getDiscussionTasks } from 'lib/discussion/getDiscussionTasks';
import { getForumCommentsTasks } from 'lib/forums/comments/getForumTasks';
import type { ForumCommentTasksGroup } from 'lib/forums/comments/interface';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { ProposalTasksGroup } from 'lib/proposal/getProposalTasks';
import { getProposalTasks } from 'lib/proposal/getProposalTasks';
import { withSessionRoute } from 'lib/session/withSession';
import { getVoteTasks } from 'lib/votes/getVoteTasks';
import type { VoteTask } from 'lib/votes/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getTasks);

export interface GetTasksResponse {
  discussions: DiscussionTasksGroup;
  votes: VoteTask[];
  proposals: ProposalTasksGroup;
  bounties: BountyTasksGroup;
  forum: ForumCommentTasksGroup;
}

async function getTasks(req: NextApiRequest, res: NextApiResponse<GetTasksResponse>) {
  const userId = req.session.user.id;
  const discussionTasks = await getDiscussionTasks(userId);
  const voteTasks = await getVoteTasks(userId);
  const proposalTasks = await getProposalTasks(userId);
  const bountiesTasks = await getBountyTasks(userId);
  const forumTasks = await getForumCommentsTasks(userId);

  return res.status(200).json({
    proposals: proposalTasks,
    votes: voteTasks,
    discussions: discussionTasks,
    bounties: bountiesTasks,
    forum: forumTasks
  });
}

export default withSessionRoute(handler);
