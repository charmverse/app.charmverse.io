import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { BountyNotification } from './interfaces';
import { notificationMetadataSelectStatement } from './utils';

export async function getBountyNotifications(userId: string): Promise<BountyNotification[]> {
  const bountyNotifications = await prisma.bountyNotification.findMany({
    where: {
      notificationMetadata: {
        userId
      }
    },
    select: {
      id: true,
      type: true,
      applicationId: true,
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
        select: notificationMetadataSelectStatement
      }
    }
  });

  return bountyNotifications.map((notification) => {
    const notificationMetadata = notification.notificationMetadata;
    const page = notification.bounty.page as Page;
    const bountyNotification = {
      id: notification.id,
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
      type: notification.type,
      archived: !!notificationMetadata.archivedAt,
      read: !!notificationMetadata.seenAt,
      group: 'bounty'
    } as BountyNotification;

    return bountyNotification;
  });
}
