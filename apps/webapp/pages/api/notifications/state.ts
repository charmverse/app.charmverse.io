import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getNotificationsState)
  .use(requireKeys(['snoozeFor', 'snoozeMessage'], 'body'))
  .put(updateNotificationsState);

export interface GetNotificationsStateResponse {
  snoozedFor: string | null;
  snoozedMessage: string | null;
}

async function getNotificationsState(req: NextApiRequest, res: NextApiResponse<GetNotificationsStateResponse>) {
  const notificationState = await prisma.userNotificationState.findUnique({
    where: {
      userId: req.session.user.id
    }
  });

  const snoozedFor = notificationState?.snoozedUntil ? notificationState.snoozedUntil.toISOString() : null;
  const snoozedMessage = notificationState?.snoozeMessage || null;

  return res.status(200).json({ snoozedFor, snoozedMessage });
}

export interface UpdateNotificationsState {
  snoozeMessage: string | null;
  snoozeFor: Date | null;
}

async function updateNotificationsState(req: NextApiRequest, res: NextApiResponse<{ ok: true }>) {
  const { snoozeFor, snoozeMessage } = req.body as UpdateNotificationsState;
  await prisma.userNotificationState.upsert({
    where: {
      userId: req.session.user.id
    },
    update: {
      snoozedUntil: snoozeFor,
      snoozeMessage
    },
    create: {
      snoozedUntil: snoozeFor,
      snoozeMessage,
      user: {
        connect: {
          id: req.session.user.id
        }
      }
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
