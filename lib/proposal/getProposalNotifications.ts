import type { Page } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import type { ProposalNotification } from './getProposalStatusChangeTasks';

export type ProposalNotificationsGroup = {
  marked: ProposalNotification[];
  unmarked: ProposalNotification[];
};

export async function getProposalNotifications(userId: string): Promise<ProposalNotificationsGroup> {
  const proposalNotifications = await prisma.proposalNotification.findMany({
    where: {
      notificationMetadata: {
        userId
      },
      type: {
        in: ['proposal.status_changed']
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
        include: {
          space: {
            select: {
              name: true,
              domain: true
            }
          },
          user: {
            select: {
              id: true,
              username: true,
              path: true,
              avatar: true,
              avatarTokenId: true,
              avatarContract: true,
              avatarChain: true,
              deletedAt: true
            }
          }
        }
      }
    }
  });

  const proposalNotificationsGroup: ProposalNotificationsGroup = {
    marked: [],
    unmarked: []
  };

  proposalNotifications.forEach((notification) => {
    const page = notification.proposal.page as Page;
    const proposalNotification: ProposalNotification = {
      taskId: notification.id,
      // TODO getProposalAction
      action: null,
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

// utils
function sortByDate<T extends { createdAt: Date }>(a: T, b: T): number {
  return a.createdAt > b.createdAt ? -1 : 1;
}
