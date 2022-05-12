import { prisma } from 'db';
import { Role, SpaceRole } from '@prisma/client';
import log from 'lib/log';
import { getGuildRoleIds } from '../getGuildRoleIds';
import { createRoleRecord } from './createRoleRecord';

export async function assignGuildRolesForUser (addresses: string[], spaceRoles: (Pick<SpaceRole, 'spaceId' | 'id' | 'userId'> & {
  // Using the most strict/narrow types to make it easier to test
  spaceRoleToRole: {
      role: Pick<Role, 'source' | 'sourceId'>;
    }[];
  })[]) {
  const userGuildRoleIds = new Set(await getGuildRoleIds(addresses));
  for (const spaceRole of spaceRoles) {
    try {
      const guildRoleIdCharmverseRoleIdRecord = await createRoleRecord(spaceRole.spaceId);
      const charmverseRoleIds: string[] = [];
      // Filter the roles that are part of the workspace only
      userGuildRoleIds.forEach(
        userGuildRoleId => {
          if (guildRoleIdCharmverseRoleIdRecord[userGuildRoleId]) {
            charmverseRoleIds.push(guildRoleIdCharmverseRoleIdRecord[userGuildRoleId]);
          }
        }
      );

      await prisma.$transaction(charmverseRoleIds.map(charmverseRoleId => prisma.spaceRoleToRole.upsert({
        where: {
          spaceRoleId_roleId: {
            roleId: charmverseRoleId,
            spaceRoleId: spaceRole.id
          }
        },
        update: {},
        create: {
          role: {
            connect: {
              id: charmverseRoleId
            }
          },
          spaceRole: {
            connect: {
              id: spaceRole.id
            }
          }
        }
      })));

      const userGuildRoleIdsInSpace = spaceRole.spaceRoleToRole.filter(spaceRoleToRole => spaceRoleToRole.role.source === 'guild_xyz').map(spaceRoleToRole => spaceRoleToRole.role.sourceId as string);

      // Filter the roles that have been imported from guild but user dont have access to, this could mean the user lost access to it
      const roleIdsUserLostAccess: string[] = [];

      userGuildRoleIdsInSpace.forEach(
        userGuildRoleIdInSpace => {
          // If the user currently dont have access to this guild role
          if (!userGuildRoleIds.has(userGuildRoleIdInSpace)) {
            roleIdsUserLostAccess.push(guildRoleIdCharmverseRoleIdRecord[userGuildRoleIdInSpace]);
          }
        }
      );

      await prisma.$transaction(roleIdsUserLostAccess.map(charmverseRoleId => prisma.spaceRoleToRole.delete({
        where: {
          spaceRoleId_roleId: {
            roleId: charmverseRoleId,
            spaceRoleId: spaceRole.id
          }
        }
      })));
    }
    catch (_) {
      log.debug(`[guild.xyz]: Failed to assign roles for userId:${spaceRole.userId}`);
    }
  }
}
