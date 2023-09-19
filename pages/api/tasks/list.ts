import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getBountyTasks } from 'lib/bounties/getBountyTasks';
import type { BountyTasksGroup } from 'lib/bounties/getBountyTasks';
import type { DiscussionNotificationsGroup } from 'lib/discussion/getDiscussionNotifications';
import { getDiscussionNotifications } from 'lib/discussion/getDiscussionNotifications';
import type { ForumTasksGroup } from 'lib/forums/getForumNotifications/getForumNotifications';
import { getForumNotifications } from 'lib/forums/getForumNotifications/getForumNotifications';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { ProposalTasksGroup } from 'lib/proposal/getProposalTasks';
import { getProposalTasks } from 'lib/proposal/getProposalTasks';
import { withSessionRoute } from 'lib/session/withSession';
import type { VoteTasksGroup } from 'lib/votes/getVoteTasks';
import { getVoteTasks } from 'lib/votes/getVoteTasks';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getTasks);

export interface GetTasksResponse {
  discussions: DiscussionNotificationsGroup;
  votes: VoteTasksGroup;
  proposals: ProposalTasksGroup;
  bounties: BountyTasksGroup;
  forum: ForumTasksGroup;
}

async function getTasks(req: NextApiRequest, res: NextApiResponse<GetTasksResponse>) {
  const userId = req.session.user.id;
  const [discussionTasks, voteTasks, proposalTasks, bountiesTasks, forumTasks] = await Promise.all([
    getDiscussionNotifications(userId),
    getVoteTasks(userId),
    getProposalTasks(userId),
    getBountyTasks(userId),
    getForumNotifications(userId)
  ]);

  return res.status(200).json({
    proposals: proposalTasks,
    votes: voteTasks,
    discussions: discussionTasks,
    bounties: bountiesTasks,
    forum: forumTasks
  });
}

export default withSessionRoute(handler);
