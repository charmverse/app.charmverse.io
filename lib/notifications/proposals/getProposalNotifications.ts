import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { ProposalNotification } from 'lib/notifications/interfaces';

import type { QueryCondition } from '../utils';
import { notificationMetadataSelectStatement, queryCondition } from '../utils';

export async function getProposalNotifications({ id, userId }: QueryCondition): Promise<ProposalNotification[]> {
  const proposalNotifications = await prisma.proposalNotification.findMany({
    where: queryCondition({ id, userId }),
    select: {
      id: true,
      type: true,
      proposal: {
        select: {
          status: true,
          page: {
            select: {
              id: true,
              path: true,
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

  return proposalNotifications.map((notification) => {
    const page = notification.proposal.page as Page;
    const proposalNotification = {
      createdAt: notification.notificationMetadata.createdAt.toISOString(),
      id: notification.id,
      pageId: page.id,
      pagePath: page.path,
      pageTitle: page.title,
      status: notification.proposal.status,
      createdBy: notification.notificationMetadata.author,
      spaceDomain: notification.notificationMetadata.space.domain,
      spaceName: notification.notificationMetadata.space.name,
      spaceId: notification.notificationMetadata.space.id,
      type: notification.type,
      archived: !!notification.notificationMetadata.archivedAt,
      read: !!notification.notificationMetadata.seenAt,
      group: 'proposal'
    } as ProposalNotification;

    return proposalNotification;
  });
}
