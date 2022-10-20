import type { BountyStatus } from '@prisma/client';

import { prisma } from 'db';

import { getBountyAction } from './getBountyAction';

export type BountyTaskAction = 'application_pending' | 'application_approved' | 'application_rejected' | 'work_submitted' | 'work_approved' | 'payment_needed' | 'payment_complete' | 'suggested_bounty';

export interface BountyTask {
  id: string;
  eventDate: Date;
  spaceDomain: string;
  spaceName: string;
  pageId: string;
  pageTitle: string;
  pagePath: string;
  status: BountyStatus;
  action: BountyTaskAction | null;
}

export type BountyTasksGroup = {
  marked: BountyTask[];
  unmarked: BountyTask[];
}

function sortBounties (bounties: BountyTask[]) {
  bounties.sort((bountyA, bountyB) => {
    return bountyA.eventDate > bountyB.eventDate ? -1 : 1;
  });
}

export async function getBountyTasks (userId: string): Promise<{
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

  const spaceIds = spaceRoles.map(spaceRole => spaceRole.spaceId);
  const roleIds = spaceRoles.map(spaceRole => spaceRole.spaceRoleToRole).flat().map(({ role }) => role.id);

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

  const userNotificationIds = new Set(userNotifications.map(userNotification => userNotification.taskId));

  const bountyRecord: { marked: BountyTask[], unmarked: BountyTask[] } = {
    marked: [],
    unmarked: []
  };

  pagesWithBounties.forEach(({ bounty, ...page }) => {
    if (bounty) {
      const isSpaceAdmin = spaceRoles.find(space => space.isAdmin && space.spaceId === bounty.spaceId);
      const isReviewer = bounty.permissions.some(perm => perm.roleId ? roleIds.includes(perm.roleId) : perm.userId === userId);
      const applications = isReviewer ? bounty.applications : bounty.applications.filter(app => app.createdBy === userId);

      applications.forEach(application => {
        const action = getBountyAction({
          isSpaceAdmin: !!isSpaceAdmin,
          bountyStatus: bounty.status,
          applicationStatus: application.status,
          isApplicant: application.createdBy === userId,
          isReviewer
        });

        const bountyTaskId = `${bounty.id}.${application.id}.${action}`;

        const bountyTask = {
          id: bountyTaskId,
          eventDate: application.updatedAt,
          pageId: page.id,
          pagePath: page.path,
          pageTitle: page.title,
          spaceDomain: page.space.domain,
          spaceName: page.space.name,
          status: bounty.status,
          action
        };

        if (!userNotificationIds.has(bountyTaskId)) {
          bountyRecord.unmarked.push(bountyTask);
        }
        else {
          bountyRecord.marked.push(bountyTask);
        }
      });
    }
  });

  sortBounties(bountyRecord.marked);
  sortBounties(bountyRecord.unmarked);

  return bountyRecord;
}
