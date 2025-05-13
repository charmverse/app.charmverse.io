import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { getCardNotifications } from '@packages/lib/notifications/cards/getCardNotifications';
import { getDocumentNotifications } from '@packages/lib/notifications/documents/getDocumentNotifications';
import { getPostNotifications } from '@packages/lib/notifications/forum/getForumNotifications';
import { getCustomNotifications } from '@packages/lib/notifications/getCustomNotifications';
import type { Notification } from '@packages/lib/notifications/interfaces';
import { getPollNotifications } from '@packages/lib/notifications/polls/getPollNotifications';
import { getProposalNotifications } from '@packages/lib/notifications/proposals/getProposalNotifications';
import { getBountyNotifications } from '@packages/lib/notifications/rewards/getRewardNotifications';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { sortByDate } from '@packages/lib/utils/dates';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getNotifications);

async function getNotifications(req: NextApiRequest, res: NextApiResponse<Notification[]>) {
  const userId = req.session.user.id;
  const notifications: Notification[] = (
    await Promise.all([
      getDocumentNotifications({ userId }),
      getCardNotifications({ userId }),
      getPollNotifications({ userId }),
      getProposalNotifications({ userId }),
      getBountyNotifications({ userId }),
      getPostNotifications({ userId }),
      getCustomNotifications({ userId })
    ])
  ).flat();

  return res.status(200).json(notifications.sort(sortByDate));
}

export default withSessionRoute(handler);
