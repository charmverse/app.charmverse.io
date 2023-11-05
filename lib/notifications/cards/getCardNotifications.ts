import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { CardNotification } from '../interfaces';
import type { QueryCondition } from '../utils';
import { notificationMetadataSelectStatement, queryCondition } from '../utils';

export async function getCardNotifications({ id, userId }: QueryCondition): Promise<CardNotification[]> {
  const cardNotifications = await prisma.cardNotification.findMany({
    where: queryCondition({ id, userId }),
    select: {
      id: true,
      type: true,
      personPropertyId: true,
      card: {
        include: {
          page: {
            select: {
              bountyId: true,
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

  return cardNotifications.map((notification) => {
    const notificationMetadata = notification.notificationMetadata;
    const page = notification.card.page as Page;
    const cardNotification = {
      id: notification.id,
      createdAt: notificationMetadata.createdAt.toISOString(),
      createdBy: notificationMetadata.author,
      pageId: page.id,
      pagePath: page.path,
      pageTitle: page.title || 'Untitled',
      spaceDomain: notificationMetadata.space.domain,
      spaceId: notificationMetadata.spaceId,
      spaceName: notificationMetadata.space.name,
      pageType: page.type,
      type: notification.type,
      personPropertyId: notification.personPropertyId,
      archived: !!notificationMetadata.archivedAt,
      read: !!notificationMetadata.seenAt,
      group: 'card'
    } as CardNotification;

    return cardNotification;
  });
}
