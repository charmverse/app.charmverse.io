import { prisma } from '@charmverse/core';
import type { BountyStatus } from '@charmverse/core/prisma';

import type { NotificationActor } from 'lib/notifications/mapNotificationActor';
import { mapNotificationActor } from 'lib/notifications/mapNotificationActor';

import { getBountyAction, getBountyActor } from './getBountyAction';

export type BountyTaskAction =
  | 'application_pending'
  | 'application_approved'
  | 'application_rejected'
  | 'work_submitted'
  | 'work_approved'
  | 'payment_needed'
  | 'payment_complete'
  | 'suggested_bounty';

export interface BountyTask {
  id: string;
  taskId: string;
  eventDate: Date;
  spaceDomain: string;
  spaceName: string;
  pageId: string;
  pageTitle: string;
  pagePath: string;
  status: BountyStatus;
  action: BountyTaskAction | null;
  createdAt: Date;
  createdBy: NotificationActor | null;
}

export type BountyTasksGroup = {
  marked: BountyTask[];
  unmarked: BountyTask[];
};

function sortBounties(bounties: BountyTask[]) {
  bounties.sort((bountyA, bountyB) => {
    return bountyA.eventDate > bountyB.eventDate ? -1 : 1;
  });
}

export async function getBountyTasks(userId: string): Promise<{
  marked: BountyTask[];
  unmarked: BountyTask[];
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

  const pagesWithBounties = await prisma.page.findMany({
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

  const bountyRecord: { marked: BountyTask[]; unmarked: BountyTask[] } = {
    marked: [],
    unmarked: []
  };
  const bountiesWithActorIds: (Omit<BountyTask, 'createdBy'> & { actorId: string | null })[] = [];

  pagesWithBounties.forEach(({ bounty, ...page }) => {
    if (bounty) {
      const isSpaceAdmin = !!spaceRoles.find((space) => space.isAdmin && space.spaceId === bounty.spaceId);
      const isReviewer = bounty.permissions.some((perm) =>
        perm.roleId ? roleIds.includes(perm.roleId) : perm.userId === userId
      );
      const applications = isReviewer
        ? bounty.applications
        : bounty.applications.filter((app) => app.createdBy === userId);

      applications.forEach((application) => {
        const isApplicant = application.createdBy === userId;
        const action = getBountyAction({
          isSpaceAdmin,
          bountyStatus: bounty.status,
          applicationStatus: application.status,
          isApplicant,
          isReviewer
        });

        if (action) {
          const bountyTaskId = `${bounty.id}.${application.id}.${action}`;

          bountiesWithActorIds.push({
            id: bountyTaskId,
            taskId: bountyTaskId,
            eventDate: application.updatedAt,
            createdAt: application.updatedAt,
            pageId: page.id,
            pagePath: page.path,
            pageTitle: page.title,
            spaceDomain: page.space.domain,
            spaceName: page.space.name,
            status: bounty.status,
            action,
            actorId: getBountyActor({ bounty, application, isApplicant, isReviewer, isSpaceAdmin })
          });
        }
      });
    }
  });

  // gather and query all actors with a single query
  const actorIds = bountiesWithActorIds.map((b) => b.actorId).filter((id): id is string => id !== null);
  const actors = await prisma.user.findMany({ where: { id: { in: actorIds } } });

  bountiesWithActorIds.forEach(({ actorId, ...bountyWithActorId }) => {
    const actorUser = actors.find((actor) => actor.id === actorId) || null;
    const bountyTask: BountyTask = {
      ...bountyWithActorId,
      createdBy: mapNotificationActor(actorUser)
    };

    if (!userNotificationIds.has(bountyTask.taskId)) {
      bountyRecord.unmarked.push(bountyTask);
    } else {
      bountyRecord.marked.push(bountyTask);
    }
  });

  sortBounties(bountyRecord.marked);
  sortBounties(bountyRecord.unmarked);

  return bountyRecord;
}
