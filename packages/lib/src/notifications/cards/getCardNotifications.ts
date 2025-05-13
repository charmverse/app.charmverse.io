import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { BoardFields, IPropertyTemplate } from '@packages/databases/board';

import type { CardNotification } from '../interfaces';
import type { QueryCondition } from '../utils';
import { notificationMetadataSelectStatement, queryCondition } from '../utils';

export async function getCardNotifications({ id, userId }: QueryCondition): Promise<CardNotification[]> {
  const cardNotifications = await prisma.cardNotification.findMany({
    where: {
      ...queryCondition({ id, userId }),
      card: {
        deletedAt: null,
        space: {
          spaceRoles: {
            some: {
              userId
            }
          }
        }
      }
    },
    select: {
      id: true,
      type: true,
      personPropertyId: true,
      card: {
        select: {
          parentId: true,
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

  const boardIds = cardNotifications
    .filter((cardNotification) => cardNotification.personPropertyId)
    .map((cardNotification) => cardNotification.card.parentId);

  const boards = await prisma.block.findMany({
    where: {
      id: {
        in: boardIds
      }
    },
    select: {
      fields: true
    }
  });

  const personPropertiesRecord: Record<string, IPropertyTemplate> = {};

  boards.forEach((board) => {
    const boardFields = board.fields as unknown as BoardFields;
    boardFields.cardProperties.forEach((property) => {
      if (property.type === 'person') {
        personPropertiesRecord[property.id] = property;
      }
    });
  });

  return (
    cardNotifications
      // Don't show notifications for a card whose page was deleted
      .filter((notification) => !!notification.card.page)
      .map((notification) => {
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
          personProperty:
            notification.personPropertyId && personPropertiesRecord[notification.personPropertyId]
              ? {
                  id: notification.personPropertyId,
                  name: personPropertiesRecord[notification.personPropertyId].name
                }
              : null,
          archived: !!notificationMetadata.archivedAt,
          read: !!notificationMetadata.seenAt,
          group: 'card'
        } as CardNotification;

        return cardNotification;
      })
  );
}
