import { prisma } from '@charmverse/core/prisma-client';
import _ from 'lodash';

export async function addMembersAndCreateNotifications() {
  const spaceId = '';
  const pageId = '';
  const spaceAdminRole = await prisma.spaceRole.findFirstOrThrow({
    where: {
      spaceId,
      isAdmin: true
    },
    select: {
      userId: true
    }
  })
  const spaceAdminId = spaceAdminRole.userId;
  const spaceDomains = ['cyber', 'taiko', 'kyoto', 'cartesi', 'safe'];
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      space: {
        domain: {
          in: spaceDomains
        }
      }
    },
    select: {
      userId: true,
      spaceId: true
    }
  })

  const spaceUserIdsRecord: Record<string, string[]> = {};
  spaceRoles.forEach((role) => {
    if (spaceUserIdsRecord[role.spaceId]) {
      spaceUserIdsRecord[role.spaceId].push(role.userId)
    } else {
      spaceUserIdsRecord[role.spaceId] = [role.userId]
    }
  })

  const totalMembers = Object.values(spaceUserIdsRecord).reduce((acc, curr) => acc + curr.length, 0)
  const sample = 200;
  const sampledUserIds: Set<string> = new Set();
  Object.values(spaceUserIdsRecord).forEach((spaceUserIds) => {
    const spaceProportion = spaceUserIds.length / totalMembers;
    const spaceSampleSize = Math.round(sample * spaceProportion);
    const spaceSampledUserIds = _.sampleSize(spaceUserIds.filter(spaceUserId => sampledUserIds.has(spaceUserId)), spaceSampleSize);
    spaceSampledUserIds.forEach((userId) => sampledUserIds.add(userId))
  })

  await prisma.spaceRole.createMany({
    data: Array.from(sampledUserIds).map((userId) => ({
      userId,
      spaceId
    }))
  })

  await Promise.all(
    Array.from(sampledUserIds).map(userId => prisma.customNotification.create({
      data: {
        notificationMetadata: {
          create: {
            userId,
            spaceId,
            createdBy: spaceAdminId,
          },
        },
        content: {
          pageId,
        },
        type: "orange-dao"
      }
    }))
  )
}

addMembersAndCreateNotifications()