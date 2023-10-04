import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { getBountyNotifications } from 'lib/notifications/getBountyNotifications';
import { getCardNotifications } from 'lib/notifications/getCardNotifications';
import { getDocumentNotifications } from 'lib/notifications/getDocumentNotifications';
import { getForumNotifications } from 'lib/notifications/getForumNotifications';
import { getProposalNotifications } from 'lib/notifications/getProposalNotifications';
import { getVoteNotifications } from 'lib/notifications/getVoteNotifications';
import type { Notification } from 'lib/notifications/interfaces';
import { sortByDate } from 'lib/notifications/utils';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getNotifications);

async function getNotifications(req: NextApiRequest, res: NextApiResponse<Notification[]>) {
  const userId = req.session.user.id;
  const notificationsGroups = await Promise.all([
    getDocumentNotifications(userId),
    getCardNotifications(userId),
    getVoteNotifications(userId),
    getProposalNotifications(userId),
    getBountyNotifications(userId),
    getForumNotifications(userId)
  ]);

  const notifications: Notification[] = notificationsGroups
    .map((group) => [...group.marked, ...group.unmarked])
    .flat()
    .sort(sortByDate);

  return res.status(200).json(notifications);
}

export default withSessionRoute(handler);
