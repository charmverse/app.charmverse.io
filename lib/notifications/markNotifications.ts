import { prisma } from '@charmverse/core/prisma-client';

export interface MarkNotifications {
  ids: string[];
  state: 'read' | 'archived' | 'unread' | 'unarchived';
}

export async function markNotifications(payload: MarkNotifications) {
  const { ids, state } = payload;

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
}
