import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { NotificationsGroup, ProposalNotification, ProposalNotificationType } from 'lib/notifications/interfaces';
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
    const proposalNotification: ProposalNotification = {
      taskId: notification.id,
      type: notification.type as ProposalNotificationType,
      createdAt: notification.notificationMetadata.createdAt,
      id: notification.id,
      pageId: page.id,
      pagePath: page.path,
      pageTitle: page.title,
      status: notification.proposal.status,
      createdBy: notification.notificationMetadata.user,
      spaceDomain: notification.notificationMetadata.space.domain,
      spaceName: notification.notificationMetadata.space.name
    };

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
