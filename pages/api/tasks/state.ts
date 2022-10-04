
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getTasksState)
  .use(requireKeys(['snoozeFor', 'snoozeMessage'], 'body'))
  .put(updateTasksState);

export interface GetTasksStateResponse {
  snoozedFor: string | null;
  snoozedMessage: string | null;
}

async function getTasksState (req: NextApiRequest, res: NextApiResponse<GetTasksStateResponse>) {

  const taskState = await prisma.userNotificationState.findUnique({
    where: {
      userId: req.session.user.id
    }
  });

  const snoozedFor = taskState?.snoozedUntil ? taskState.snoozedUntil.toISOString() : null;
  const snoozedMessage = taskState?.snoozeMessage || null;

  return res.status(200).json({ snoozedFor, snoozedMessage });
}

export interface UpdateTasksState {
  snoozeMessage: string | null;
  snoozeFor: Date | null;
}

async function updateTasksState (req: NextApiRequest, res: NextApiResponse<{ ok: true }>) {
  const { snoozeFor, snoozeMessage } = req.body as UpdateTasksState;
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
