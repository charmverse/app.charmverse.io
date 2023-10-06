import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { BountyNotification, NotificationsGroup } from './interfaces';
import { notificationMetadataIncludeStatement, sortByDate } from './utils';

export async function getBountyNotifications(userId: string): Promise<NotificationsGroup<BountyNotification>> {
  const pageNotifications = await prisma.bountyNotification.findMany({
    where: {
      notificationMetadata: {
        userId
      }
    },
    include: {
      bounty: {
        select: {
          status: true,
          page: {
            select: {
              id: true,
              path: true,
              type: true,
              title: true
            }
          }
        }
      },
      notificationMetadata: {
        include: notificationMetadataIncludeStatement
      }
    }
  });

  const bountyNotificationsGroup: NotificationsGroup<BountyNotification> = {
    marked: [],
    unmarked: []
  };

  pageNotifications.forEach((notification) => {
    const notificationMetadata = notification.notificationMetadata;
    const page = notification.bounty.page as Page;
    const bountyNotification = {
      taskId: notification.id,
      applicationId: notification.applicationId,
      createdAt: notificationMetadata.createdAt.toISOString(),
      createdBy: notificationMetadata.author,
      pageId: page.id,
      pagePath: page.path,
      pageTitle: page.title || 'Untitled',
      spaceDomain: notificationMetadata.space.domain,
      spaceId: notificationMetadata.spaceId,
      spaceName: notificationMetadata.space.name,
      status: notification.bounty.status,
      type: notification.type
    } as BountyNotification;

    if (notification.notificationMetadata.seenAt) {
      bountyNotificationsGroup.marked.push(bountyNotification);
    } else {
      bountyNotificationsGroup.unmarked.push(bountyNotification);
    }
  });

  return {
    marked: bountyNotificationsGroup.marked.sort(sortByDate),
    unmarked: bountyNotificationsGroup.unmarked.sort(sortByDate)
  };
}
