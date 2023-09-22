import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getBountyTasks } from 'lib/bounties/getBountyTasks';
import type { BountyTasksGroup } from 'lib/bounties/getBountyTasks';
import type { DiscussionNotificationsGroup } from 'lib/discussion/getDiscussionNotifications';
import { getDiscussionNotifications } from 'lib/discussion/getDiscussionNotifications';
import type { ForumNotificationsGroup } from 'lib/forums/notifications/getForumNotifications';
import { getForumNotifications } from 'lib/forums/notifications/getForumNotifications';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { ProposalNotificationsGroup } from 'lib/notifications/getProposalNotifications';
import { getProposalNotifications } from 'lib/notifications/getProposalNotifications';
import { withSessionRoute } from 'lib/session/withSession';
import type { VoteTasksGroup } from 'lib/votes/getVoteTasks';
import { getVoteTasks } from 'lib/votes/getVoteTasks';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getTasks);

export interface GetTasksResponse {
  discussions: DiscussionNotificationsGroup;
  votes: VoteTasksGroup;
  proposals: ProposalNotificationsGroup;
  bounties: BountyTasksGroup;
  forum: ForumNotificationsGroup;
}

async function getTasks(req: NextApiRequest, res: NextApiResponse<GetTasksResponse>) {
  const userId = req.session.user.id;
  const [discussionTasks, voteTasks, proposalTasks, bountiesTasks, forumTasks] = await Promise.all([
    getDiscussionNotifications(userId),
    getVoteTasks(userId),
    getProposalNotifications(userId),
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
