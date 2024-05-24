import { prisma } from '@charmverse/core/prisma-client';
import _ from 'lodash';

export async function addMembersAndCreateNotifications() {
  const spaceId = '';
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

  const spaceRolesRecord: Record<string, string[]> = {};
  spaceRoles.forEach((role) => {
    if (spaceRolesRecord[role.spaceId]) {
      spaceRolesRecord[role.spaceId].push(role.userId)
    } else {
      spaceRolesRecord[role.spaceId] = [role.userId]
    }
  })

  const totalMembers = Object.values(spaceRolesRecord).reduce((acc, curr) => acc + curr.length, 0)
  const sample = 200;
  const sampledMembers: string[] = [];
  for (const spaceId in spaceRolesRecord) {
    const spaceMembers = spaceRolesRecord[spaceId];
    const spaceProportion = spaceMembers.length / totalMembers;
    const spaceSampleSize = Math.round(sample * spaceProportion);
    const sampledSpaceMembers = _.sampleSize(spaceMembers, spaceSampleSize);
    sampledMembers.push(...sampledSpaceMembers);
  }

  await prisma.spaceRole.createMany({
    data: sampledMembers.map((userId) => ({
      userId,
      spaceId
    }))
  })

  await Promise.all(
    sampledMembers.map(userId => prisma.customNotification.create({
      data: {
        notificationMetadata: {
          create: {
            userId,
            spaceId,
            createdBy: spaceAdminId,
          },
        },
        type: "orange-dao"
      }
    }))
  )
}

addMembersAndCreateNotifications()