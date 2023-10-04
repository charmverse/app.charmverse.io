import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { NotificationsGroup, ProposalNotification } from 'lib/notifications/interfaces';
import { notificationMetadataIncludeStatement, sortByDate, upgradedNotificationUserIds } from 'lib/notifications/utils';
import { getProposalTasks } from 'lib/proposal/getProposalTasks';

export async function getProposalNotifications(userId: string): Promise<NotificationsGroup<ProposalNotification>> {
  if (upgradedNotificationUserIds.includes(userId)) {
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
      const notificationMetadata = notification.notificationMetadata;
      const proposalNotification = {
        createdAt: notificationMetadata.createdAt.toISOString(),
        taskId: notification.id,
        pageId: page.id,
        pagePath: page.path,
        pageTitle: page.title,
        status: notification.proposal.status,
        createdBy: notificationMetadata.author,
        spaceDomain: notificationMetadata.space.domain,
        spaceName: notificationMetadata.space.name,
        spaceId: notificationMetadata.space.id,
        commentId: notification.commentId,
        inlineCommentId: notification.inlineCommentId,
        mentionId: notification.mentionId,
        type: notification.type,
        group: 'proposal',
        archived: !!notificationMetadata.archived,
        read: !!notificationMetadata.seenAt
      } as ProposalNotification;

      if (notificationMetadata.seenAt) {
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

  return getProposalTasks(userId);
}
