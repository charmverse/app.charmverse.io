import type { BountyStatus as RewardStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import type { NotificationActor } from 'lib/notifications/mapNotificationActor';
import { mapNotificationActor } from 'lib/notifications/mapNotificationActor';

import { getRewardAction, getRewardActor } from './getRewardAction';

export type RewardTaskAction =
  | 'application_pending'
  | 'application_approved'
  | 'application_rejected'
  | 'work_submitted'
  | 'work_approved'
  | 'payment_needed'
  | 'payment_complete'
  | 'suggested_reward';

export interface RewardTask {
  id: string;
  taskId: string;
  eventDate: Date;
  spaceDomain: string;
  spaceName: string;
  pageId: string;
  pageTitle: string;
  pagePath: string;
  status: RewardStatus;
  action: RewardTaskAction | null;
  createdAt: Date;
  createdBy: NotificationActor | null;
}

export type RewardTasksGroup = {
  marked: RewardTask[];
  unmarked: RewardTask[];
};

function sortRewards(rewards: RewardTask[]) {
  rewards.sort((rewardA, rewardB) => {
    return rewardA.eventDate > rewardB.eventDate ? -1 : 1;
  });
}

export async function getRewardTasks(userId: string): Promise<{
  marked: RewardTask[];
  unmarked: RewardTask[];
}> {
  const userNotifications = await prisma.userNotification.findMany({
    where: {
      userId
    }
  });

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    select: {
      spaceId: true,
      isAdmin: true,
      spaceRoleToRole: {
        where: {
          spaceRole: {
            userId
          }
        },
        select: {
          role: {
            select: {
              id: true
            }
          }
        }
      }
    }
  });

  const spaceIds = spaceRoles.map((spaceRole) => spaceRole.spaceId);
  const roleIds = spaceRoles
    .map((spaceRole) => spaceRole.spaceRoleToRole)
    .flat()
    .map(({ role }) => role.id);

  const pagesWithRewards = await prisma.page.findMany({
    where: {
      deletedAt: null,
      spaceId: {
        in: spaceIds
      },
      type: 'bounty'
    },
    include: {
      bounty: {
        include: {
          permissions: true,
          applications: true
        }
      },
      space: true
    }
  });

  const userNotificationIds = new Set(userNotifications.map((userNotification) => userNotification.taskId));

  const rewardRecord: { marked: RewardTask[]; unmarked: RewardTask[] } = {
    marked: [],
    unmarked: []
  };
  const rewardsWithActorIds: (Omit<RewardTask, 'createdBy'> & { actorId: string | null })[] = [];

  pagesWithRewards.forEach(({ bounty: reward, ...page }) => {
    if (reward) {
      const isSpaceAdmin = !!spaceRoles.find((space) => space.isAdmin && space.spaceId === reward.spaceId);
      const isReviewer = reward.permissions.some((perm) =>
        perm.roleId ? roleIds.includes(perm.roleId) : perm.userId === userId
      );
      const applications = isReviewer
        ? reward.applications
        : reward.applications.filter((app) => app.createdBy === userId);

      applications.forEach((application) => {
        const isApplicant = application.createdBy === userId;
        const action = getRewardAction({
          isSpaceAdmin,
          rewardStatus: reward.status,
          applicationStatus: application.status,
          isApplicant,
          isReviewer
        });

        if (action) {
          const rewardTaskId = `${reward.id}.${application.id}.${action}`;

          rewardsWithActorIds.push({
            id: rewardTaskId,
            taskId: rewardTaskId,
            eventDate: application.updatedAt,
            createdAt: application.updatedAt,
            pageId: page.id,
            pagePath: page.path,
            pageTitle: page.title,
            spaceDomain: page.space.domain,
            spaceName: page.space.name,
            status: reward.status,
            action,
            actorId: getRewardActor({ reward, application, isApplicant, isReviewer, isSpaceAdmin })
          });
        }
      });
    }
  });

  // gather and query all actors with a single query
  const actorIds = rewardsWithActorIds.map((b) => b.actorId).filter((id): id is string => id !== null);
  const actors = await prisma.user.findMany({ where: { id: { in: actorIds } } });

  rewardsWithActorIds.forEach(({ actorId, ...rewardWithActorId }) => {
    const actorUser = actors.find((actor) => actor.id === actorId) || null;
    const rewardTask: RewardTask = {
      ...rewardWithActorId,
      createdBy: mapNotificationActor(actorUser)
    };

    if (!userNotificationIds.has(rewardTask.taskId)) {
      rewardRecord.unmarked.push(rewardTask);
    } else {
      rewardRecord.marked.push(rewardTask);
    }
  });

  sortRewards(rewardRecord.marked);
  sortRewards(rewardRecord.unmarked);

  return rewardRecord;
}
