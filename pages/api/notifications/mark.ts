import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(markNotificationsHandler);

export interface MarkNotifications {
  ids: string[];
  state: 'read' | 'archived' | 'unread' | 'unarchived';
}

async function markNotificationsHandler(req: NextApiRequest, res: NextApiResponse<{ ok: boolean }>) {
  const { ids, state } = req.body as MarkNotifications;

  switch (state) {
    case 'read': {
      await prisma.userNotificationMetadata.updateMany({
        where: {
          id: {
            in: ids
          }
        },
        data: {
          seenAt: new Date(),
          channel: 'webapp'
        }
      });
      break;
    }

    case 'archived': {
      await prisma.userNotificationMetadata.updateMany({
        where: {
          id: {
            in: ids
          }
        },
        data: {
          archivedAt: new Date(),
          seenAt: new Date(),
          channel: 'webapp'
        }
      });
      break;
    }

    case 'unarchived': {
      await prisma.userNotificationMetadata.updateMany({
        where: {
          id: {
            in: ids
          }
        },
        data: {
          archivedAt: null
        }
      });
      break;
    }

    case 'unread': {
      await prisma.userNotificationMetadata.updateMany({
        where: {
          id: {
            in: ids
          }
        },
        data: {
          seenAt: null,
          channel: null
        }
      });
      break;
    }

    default: {
      break;
    }
  }

  return res.status(200).end();
}

export default withSessionRoute(handler);
