import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { NotificationsGroup, ProposalNotification } from 'lib/notifications/interfaces';
import { notificationMetadataIncludeStatement, sortByDate } from 'lib/notifications/utils';

export async function getProposalNotifications(userId: string): Promise<NotificationsGroup<ProposalNotification>> {
  const proposalNotifications = await prisma.proposalNotification.findMany({
    where: {
      notificationMetadata: {
        userId
      }
    },
    include: {
      proposal: {
        include: {
          authors: true,
          reviewers: true,
          page: true
        }
      },
      notificationMetadata: {
        include: notificationMetadataIncludeStatement
      }
    }
  });

  const proposalNotificationsGroup: NotificationsGroup<ProposalNotification> = {
    marked: [],
    unmarked: []
  };

  proposalNotifications.forEach((notification) => {
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
      type: notification.type
    } as ProposalNotification;

    if (notification.notificationMetadata.seenAt) {
      proposalNotificationsGroup.marked.push(proposalNotification);
    } else {
      proposalNotificationsGroup.unmarked.push(proposalNotification);
    }
  });

  return {
    marked: proposalNotificationsGroup.marked.sort(sortByDate),
    unmarked: proposalNotificationsGroup.unmarked.sort(sortByDate)
  };
}
