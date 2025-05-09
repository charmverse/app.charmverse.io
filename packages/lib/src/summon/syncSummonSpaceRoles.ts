import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getSummonProfile } from '@packages/profile/getSummonProfile';

import { getSummonRoleLabel } from './getSummonRoleLabel';

export async function syncSummonSpaceRoles({
  spaceId,
  userId,
  summonTestUrl
}: {
  summonTestUrl?: string;
  userId?: string;
  spaceId: string;
}) {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    }
  });
  let totalSpaceRolesAdded = 0;
  let totalSpaceRolesUpdated = 0;

  if (!space.xpsEngineId) {
    log.debug('Space does not have a Summon tenant ID', { spaceId });
    return {
      totalSpaceRolesAdded,
      totalSpaceRolesUpdated
    };
  }

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId,
      user: userId
        ? {
            isBot: false,
            id: userId
          }
        : {
            isBot: false
          }
    },
    select: {
      id: true,
      spaceId: true,
      xpsUserId: true,
      user: {
        select: {
          id: true,
          discordUser: {
            select: {
              account: true
            }
          },
          email: true,
          wallets: {
            select: {
              address: true
            }
          }
        }
      }
    }
  });

  const spaceRoleToRoles = await prisma.spaceRoleToRole.findMany({
    where: {
      role: {
        source: 'summon',
        spaceId
      }
    },
    select: {
      spaceRole: {
        select: {
          userId: true
        }
      },
      role: {
        select: {
          name: true,
          id: true
        }
      }
    }
  });

  const rolesRecord: Record<
    string,
    {
      id: string;
      name: string;
      memberIds: string[];
    }
  > = {};

  spaceRoleToRoles.forEach((spaceRoleToRole) => {
    if (!rolesRecord[spaceRoleToRole.role.name]) {
      rolesRecord[spaceRoleToRole.role.name] = {
        id: spaceRoleToRole.role.id,
        name: spaceRoleToRole.role.name,
        memberIds: []
      };
    }
    rolesRecord[spaceRoleToRole.role.name].memberIds.push(spaceRoleToRole.spaceRole.userId);
  });

  for (const spaceRole of spaceRoles) {
    try {
      const summonProfile = await getSummonProfile({
        userId: spaceRole.user.id,
        spaceId: spaceRole.spaceId,
        summonTestUrl
      });
      const userRank = summonProfile ? Math.floor(summonProfile.meta.rank) : null;
      if (summonProfile && userRank) {
        if (!spaceRole.xpsUserId) {
          await prisma.spaceRole.update({
            where: {
              id: spaceRole.id
            },
            data: {
              xpsUserId: summonProfile.id
            }
          });
        }
        if (!rolesRecord[getSummonRoleLabel({ level: userRank })]) {
          const role = await prisma.role.create({
            data: {
              name: getSummonRoleLabel({ level: userRank }),
              source: 'summon',
              spaceId,
              createdBy: space.createdBy
            }
          });

          rolesRecord[role.name] = {
            id: role.id,
            name: role.name,
            memberIds: []
          };
        }

        const currentRole = Object.values(rolesRecord).find((role) => role.memberIds.includes(spaceRole.user.id));
        const newRole = rolesRecord[getSummonRoleLabel({ level: userRank })];

        // If the user has a summon role, but its different than the current one, replace it
        if (currentRole && currentRole.name !== getSummonRoleLabel({ level: userRank })) {
          await prisma.spaceRoleToRole.updateMany({
            where: {
              roleId: currentRole.id,
              spaceRoleId: spaceRole.id
            },
            data: {
              roleId: newRole.id
            }
          });
          rolesRecord[currentRole.name].memberIds = rolesRecord[currentRole.name].memberIds.filter(
            (memberId) => memberId !== spaceRole.user.id
          );
          rolesRecord[getSummonRoleLabel({ level: userRank })].memberIds.push(spaceRole.user.id);
          totalSpaceRolesUpdated += 1;
        } else if (!currentRole) {
          await prisma.spaceRoleToRole.create({
            data: {
              roleId: newRole.id,
              spaceRoleId: spaceRole.id
            }
          });
          totalSpaceRolesAdded += 1;
          rolesRecord[getSummonRoleLabel({ level: userRank })].memberIds.push(spaceRole.user.id);
        }
      }
    } catch (err: any) {
      log.error(`Error syncing summon space role for user ${userId}: ${err.stack || err.message || err}`, {
        err,
        spaceId,
        userId: spaceRole.user.id
      });
    }
  }

  return {
    totalSpaceRolesAdded,
    totalSpaceRolesUpdated
  };
}
