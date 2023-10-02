import type { BulkPagePermissionFlags } from '@charmverse/core/permissions';
import type { PostCategory, SubscriptionTier, User, UserVote, Vote, VoteOptions } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { arrayUtils } from '@charmverse/core/utilities';

import type { NotificationActor, VoteNotification } from 'lib/notifications/interfaces';
import { publicPermissionsClient } from 'lib/permissions/api/client';
import { premiumPermissionsApiClient } from 'lib/permissions/api/routers';

import { aggregateVoteResult } from './aggregateVoteResult';
import { calculateVoteStatus } from './calculateVoteStatus';

type VoteWithInfo = Vote & {
  page: { id: string; path: string; title: string } | null;
  post: { id: string; path: string; title: string; categoryId: string } | null;
  space: { name: string; domain: string; paidTier: SubscriptionTier; id: string };
  userVotes: UserVote[];
  voteOptions: VoteOptions[];
  author: NotificationActor;
};

export interface VoteTasksGroup {
  marked: VoteNotification[];
  unmarked: VoteNotification[];
}
export async function getVoteTasks(userId: string): Promise<VoteTasksGroup> {
  const votes = await prisma.vote.findMany({
    where: {
      space: {
        spaceRoles: {
          some: {
            userId
          }
        }
      },
      context: 'inline',
      status: 'InProgress'
    },
    orderBy: {
      deadline: 'desc'
    },
    include: {
      page: {
        select: { id: true, path: true, title: true, type: true }
      },
      post: {
        select: { id: true, path: true, title: true, categoryId: true }
      },
      space: {
        select: {
          id: true,
          name: true,
          domain: true,
          paidTier: true
        }
      },
      userVotes: true,
      voteOptions: true,
      author: {
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
  });

  const voteBuckets = votes.reduce(
    (acc, vote) => {
      if (vote.page && vote.space.paidTier === 'free') {
        acc.freeSpacePageVotes.push(vote);
      } else if (vote.page) {
        acc.paidSpacePageVotes.push(vote);
      } else if (vote.post && vote.space.paidTier === 'free') {
        acc.freeSpacePostVotes.push(vote);
      } else if (vote.post) {
        acc.paidSpacePostVotes.push(vote);
      }

      return acc;
    },
    {
      freeSpacePostVotes: [] as VoteWithInfo[],
      freeSpacePageVotes: [] as VoteWithInfo[],
      paidSpacePostVotes: [] as VoteWithInfo[],
      paidSpacePageVotes: [] as VoteWithInfo[]
    }
  );

  const [freePostCategories, paidPostCategories] = await Promise.all([
    prisma.postCategory
      .findMany({
        where: {
          id: {
            in: arrayUtils.uniqueValues(voteBuckets.freeSpacePostVotes.map((vote) => vote.post?.categoryId as string))
          }
        }
      })
      .then((categories) =>
        categories.reduce((acc, category) => {
          if (!acc[category.spaceId]) {
            acc[category.spaceId] = [category];
          } else {
            acc[category.spaceId].push(category);
          }
          return acc;
        }, {} as Record<string, PostCategory[]>)
      ),
    prisma.postCategory
      .findMany({
        where: {
          id: {
            in: arrayUtils.uniqueValues(voteBuckets.paidSpacePostVotes.map((vote) => vote.post?.categoryId as string))
          }
        }
      })
      .then((categories) =>
        categories.reduce((acc, category) => {
          if (!acc[category.spaceId]) {
            acc[category.spaceId] = [category];
          } else {
            acc[category.spaceId].push(category);
          }
          return acc;
        }, {} as Record<string, PostCategory[]>)
      )
  ]);

  const freeSpaceCommentablePostCategories = (
    await Promise.all(
      Object.entries(freePostCategories).map(([spaceId, categories]) =>
        publicPermissionsClient.forum.getPermissionedCategories({ postCategories: categories, userId })
      )
    )
  )
    .flat()
    .filter((category) => category.permissions.comment_posts)
    .reduce((acc, category) => {
      acc[category.id] = category;
      return acc;
    }, {} as Record<string, PostCategory>);

  const paidSpaceCommentablePostCategories = (
    await Promise.all(
      Object.entries(paidPostCategories).map(([spaceId, categories]) =>
        premiumPermissionsApiClient.forum
          .getPermissionedCategories({ postCategories: categories, userId })
          .then((data) => {
            return data;
          })
      )
    )
  )
    .flat()
    .filter((category) => category.permissions.comment_posts)
    .reduce((acc, category) => {
      acc[category.id] = category;
      return acc;
    }, {} as Record<string, PostCategory>);

  const [commentableFreeSpacePages, commentablePaidSpacePages] = await Promise.all([
    voteBuckets.freeSpacePageVotes.length === 0
      ? Promise.resolve({} as BulkPagePermissionFlags)
      : publicPermissionsClient.pages.bulkComputePagePermissions({
          pageIds: voteBuckets.freeSpacePageVotes.map((vote) => vote.pageId as string),
          userId
        }),
    voteBuckets.paidSpacePageVotes.length === 0
      ? Promise.resolve({} as BulkPagePermissionFlags)
      : premiumPermissionsApiClient.pages.bulkComputePagePermissions({
          pageIds: voteBuckets.paidSpacePageVotes.map((vote) => vote.pageId as string),
          userId
        })
  ]);

  const filteredVotes = votes.filter((vote) => {
    if (vote.pageId) {
      return commentableFreeSpacePages[vote.pageId]?.comment || commentablePaidSpacePages[vote.pageId]?.comment;
    } else if (vote.postId) {
      return (
        freeSpaceCommentablePostCategories[vote.post?.categoryId as string] ||
        paidSpaceCommentablePostCategories[vote.post?.categoryId as string]
      );
    }
    return false;
  });

  const now = new Date();
  const futureVotes = filteredVotes
    .filter((item) => item.deadline > now)
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  const pastVotes = filteredVotes.filter((item) => item.deadline <= now);
  const sortedVotes = [...futureVotes, ...pastVotes];

  const userNotifications = await prisma.userNotification.findMany({
    where: {
      userId,
      type: 'vote'
    }
  });
  const markedNotificationIds = new Set(userNotifications.map((userNotification) => userNotification.taskId));

  const marked: VoteNotification[] = [];
  const unmarked: VoteNotification[] = [];

  sortedVotes.forEach((vote) => {
    const voteStatus = calculateVoteStatus(vote);
    const userVotes = vote.userVotes.filter((uv) => uv.choices.length) ?? [];
    const { aggregatedResult, userChoice } = aggregateVoteResult({
      userId,
      userVotes,
      voteOptions: vote.voteOptions
    });

    delete (vote as any).userVotes;

    const task: VoteNotification = {
      userChoice,
      status: voteStatus,
      createdBy: vote.author,
      categoryId: vote.post?.categoryId || null,
      createdAt: vote.createdAt.toISOString(),
      deadline: vote.deadline,
      pageType: vote.page?.type === 'page' ? 'page' : 'post',
      spaceId: vote.space.id,
      title: vote.title || 'Untitled',
      type: 'new_vote',
      taskId: vote.id,
      spaceName: vote.space.name,
      spaceDomain: vote.space.domain,
      pagePath: vote.page?.path || `forum/post/${vote.post?.path}`,
      pageTitle: vote.page?.title || vote.post?.title || 'Untitled',
      voteId: vote.id
    };

    if (markedNotificationIds.has(task.taskId)) {
      marked.push(task);
    } else {
      unmarked.push(task);
    }
  });

  return { marked, unmarked };
}
