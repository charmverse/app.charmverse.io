import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { getBountyNotifications } from 'lib/notifications/getBountyNotifications';
import { getCardNotifications } from 'lib/notifications/getCardNotifications';
import { getDocumentNotifications } from 'lib/notifications/getDocumentNotifications';
import { getPostNotifications } from 'lib/notifications/getPostNotifications';
import { getProposalNotifications } from 'lib/notifications/getProposalNotifications';
import { getVoteNotifications } from 'lib/notifications/getVoteNotifications';
import type { Notification } from 'lib/notifications/interfaces';
import { sortByDate } from 'lib/notifications/utils';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getNotifications);

async function getNotifications(req: NextApiRequest, res: NextApiResponse<Notification[]>) {
  const userId = req.session.user.id;
  const notifications: Notification[] = (
    await Promise.all([
      getDocumentNotifications(userId),
      getCardNotifications(userId),
      getVoteNotifications(userId),
      getProposalNotifications(userId),
      getBountyNotifications(userId),
      getPostNotifications(userId)
    ])
  ).flat();

  return res.status(200).json(notifications.sort(sortByDate));
}

export default withSessionRoute(handler);
