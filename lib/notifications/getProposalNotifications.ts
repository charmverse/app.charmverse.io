import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { ProposalNotification } from 'lib/notifications/interfaces';
import { notificationMetadataSelectStatement } from 'lib/notifications/utils';

export async function getProposalNotifications(userId: string): Promise<ProposalNotification[]> {
  const proposalNotifications = await prisma.proposalNotification.findMany({
    where: {
      notificationMetadata: {
        userId
      }
    },
    select: {
      id: true,
      type: true,
      proposal: {
        include: {
          authors: true,
          reviewers: true,
          page: true
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
      taskId: notification.id,
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
