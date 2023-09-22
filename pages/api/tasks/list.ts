import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { getBountyTasks } from 'lib/notifications/getBountyNotifications';
import type { BountyTasksGroup } from 'lib/notifications/getBountyNotifications';
import { getDiscussionNotifications } from 'lib/notifications/getDiscussionNotifications';
import { getForumNotifications } from 'lib/notifications/getForumNotifications';
import { getProposalNotifications } from 'lib/notifications/getProposalNotifications';
import { getVoteNotifications } from 'lib/notifications/getVoteNotifications';
import type {
  DiscussionNotification,
  ForumNotification,
  NotificationsGroup,
  ProposalNotification,
  VoteNotification
} from 'lib/notifications/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getTasks);

export interface GetTasksResponse {
  discussions: NotificationsGroup<DiscussionNotification>;
  votes: NotificationsGroup<VoteNotification>;
  proposals: NotificationsGroup<ProposalNotification>;
  bounties: BountyTasksGroup;
  forum: NotificationsGroup<ForumNotification>;
}

async function getTasks(req: NextApiRequest, res: NextApiResponse<GetTasksResponse>) {
  const userId = req.session.user.id;
  const [discussionTasks, voteTasks, proposalTasks, bountiesTasks, forumTasks] = await Promise.all([
    getDiscussionNotifications(userId),
    getVoteNotifications(userId),
    getProposalNotifications(userId),
    getBountyNotifications(userId),
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
