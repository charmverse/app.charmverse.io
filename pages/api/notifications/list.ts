import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { getBountyNotifications } from 'lib/notifications/getBountyNotifications';
import { getDiscussionNotifications } from 'lib/notifications/getDiscussionNotifications';
import { getForumNotifications } from 'lib/notifications/getForumNotification';
import { getProposalNotifications } from 'lib/notifications/getProposalNotifications';
import { getVoteNotifications } from 'lib/notifications/getVoteNotifications';
import type {
  BountyNotification,
  DiscussionNotification,
  ForumNotification,
  NotificationsGroup,
  ProposalNotification,
  VoteNotification
} from 'lib/notifications/interfaces';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getNotifications);

export interface GetNotificationsResponse {
  discussions: NotificationsGroup<DiscussionNotification>;
  votes: NotificationsGroup<VoteNotification>;
  proposals: NotificationsGroup<ProposalNotification>;
  bounties: NotificationsGroup<BountyNotification>;
  forum: NotificationsGroup<ForumNotification>;
}

async function getNotifications(req: NextApiRequest, res: NextApiResponse<GetNotificationsResponse>) {
  const userId = req.session.user.id;
  const [discussionNotifications, voteNotifications, proposalNotifications, bountiesNotifications, forumNotifications] =
    await Promise.all([
      getDiscussionNotifications(userId),
      getVoteNotifications(userId),
      getProposalNotifications(userId),
      getBountyNotifications(userId),
      getForumNotifications(userId)
    ]);

  return res.status(200).json({
    proposals: proposalNotifications,
    votes: voteNotifications,
    discussions: discussionNotifications,
    bounties: bountiesNotifications,
    forum: forumNotifications
  });
}

export default withSessionRoute(handler);
