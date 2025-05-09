import { prisma } from '@charmverse/core/prisma-client';
import type { VoteNotification } from '@packages/lib/notifications/interfaces';

import { aggregateVoteResult } from '../../votes/aggregateVoteResult';
import { calculateVoteStatus } from '../../votes/calculateVoteStatus';
import type { QueryCondition } from '../utils';
import { notificationMetadataSelectStatement, queryCondition } from '../utils';

export async function getPollNotifications({ id, userId }: QueryCondition): Promise<VoteNotification[]> {
  const voteNotifications = await prisma.voteNotification.findMany({
    where: {
      ...queryCondition({ id, userId }),
      vote: {
        space: {
          spaceRoles: {
            some: {
              userId
            }
          }
        },
        OR: [
          {
            NOT: {
              page: null
            },
            page: {
              deletedAt: null
            }
          },
          {
            NOT: {
              post: null
            },
            post: {
              deletedAt: null
            }
          }
        ]
      }
    },
    orderBy: {
      vote: {
        deadline: 'desc'
      }
    },
    select: {
      id: true,
      type: true,
      vote: {
        include: {
          space: {
            select: {
              spaceRoles: true
            }
          },
          page: {
            select: {
              id: true,
              path: true,
              title: true
            }
          },
          post: {
            select: {
              categoryId: true,
              path: true,
              title: true
            }
          },
          userVotes: {
            select: {
              choices: true,
              userId: true,
              tokenAmount: true
            }
          },
          voteOptions: {
            select: {
              name: true
            }
          }
        }
      },
      notificationMetadata: {
        select: notificationMetadataSelectStatement
      }
    }
  });

  const now = new Date();
  const futureVotes = voteNotifications
    .filter((item) => item.vote.deadline > now)
    .sort((a, b) => a.vote.deadline.getTime() - b.vote.deadline.getTime());
  const pastVotes = voteNotifications.filter((item) => item.vote.deadline <= now);
  const sortedVoteNotifications = [...futureVotes, ...pastVotes];

  return sortedVoteNotifications.map((notification) => {
    const voteStatus = calculateVoteStatus(notification.vote);
    const page = notification.vote.page;
    const post = notification.vote.post;
    const space = notification.notificationMetadata.space;
    const userVotes = notification.vote.userVotes.filter((uv) => uv.choices.length) ?? [];
    const { userChoice } = aggregateVoteResult({
      userId,
      userVotes,
      voteOptions: notification.vote.voteOptions
    });

    const voteNotification: VoteNotification = {
      id: notification.id,
      userChoice,
      title: notification.vote.title,
      status: voteStatus,
      createdBy: notification.notificationMetadata.author,
      pagePath: page?.path ?? post?.path ?? '',
      pageTitle: page?.title ?? post?.title ?? 'Untitled',
      pageType: page ? 'page' : 'post',
      categoryId: post?.categoryId ?? null,
      spaceDomain: space.domain,
      spaceName: space.name,
      spaceId: space.id,
      type: notification.type as VoteNotification['type'],
      createdAt: notification.notificationMetadata.createdAt.toISOString(),
      deadline: notification.vote.deadline,
      voteId: notification.vote.id,
      archived: !!notification.notificationMetadata.archivedAt,
      group: 'vote',
      read: !!notification.notificationMetadata.seenAt
    };

    return voteNotification;
  });
}
