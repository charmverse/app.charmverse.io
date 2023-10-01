import { prisma } from '@charmverse/core/prisma-client';

import type { BountyNotification } from 'lib/notifications/interfaces';

import { BountyActionConversionRecord, getBountyAction } from './getBountyAction';

function sortBounties(bounties: BountyNotification[]) {
  bounties.sort((bountyA, bountyB) => {
    return bountyA.createdAt > bountyB.createdAt ? -1 : 1;
  });
}

export async function getBountyTasks(userId: string): Promise<{
  marked: BountyNotification[];
  unmarked: BountyNotification[];
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
          author: true,
          permissions: true,
          applications: {
            include: {
              applicant: {
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
      },
      space: true
    }
  });

  const userNotificationIds = new Set(userNotifications.map((userNotification) => userNotification.taskId));

  const bountyRecord: { marked: BountyNotification[]; unmarked: BountyNotification[] } = {
    marked: [],
    unmarked: []
  };

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
          const bountyTaskId = `${bounty.id}.${application.id}.${BountyActionConversionRecord[action]}`;

          const bountyNotification = {
            taskId: bountyTaskId,
            createdAt: application.updatedAt.toDateString(),
            pageId: page.id,
            pagePath: page.path,
            pageTitle: page.title,
            spaceDomain: page.space.domain,
            spaceName: page.space.name,
            status: bounty.status,
            type: action,
            applicationId: application.id,
            inlineCommentId: null,
            mentionId: null,
            spaceId: page.spaceId,
            createdBy: application.applicant
          } as BountyNotification;

          if (!userNotificationIds.has(bountyTaskId)) {
            bountyRecord.unmarked.push(bountyNotification);
          } else {
            bountyRecord.marked.push(bountyNotification);
          }
        }
      });
    }
  });

  sortBounties(bountyRecord.marked);
  sortBounties(bountyRecord.unmarked);

  return bountyRecord;
}
