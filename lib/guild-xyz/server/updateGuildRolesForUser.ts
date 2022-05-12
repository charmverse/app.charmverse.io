import { prisma } from 'db';
import { Role, SpaceRole } from '@prisma/client';
import log from 'lib/log';
import { getGuildRoleIds } from '../getGuildRoleIds';
import { createRoleRecord } from './createRoleRecord';
import { assignRolesToUser } from './assignRolesToUser';

export async function updateGuildRolesForUser (addresses: string[], spaceRoles: (Pick<SpaceRole, 'spaceId' | 'id' | 'userId'> & {
  // Using the most strict/narrow types to make it easier to test
  spaceRoleToRole: {
      role: Pick<Role, 'source' | 'sourceId'>;
    }[];
  })[]) {
  const userGuildRoleIds = new Set(await getGuildRoleIds(addresses));
  for (const spaceRole of spaceRoles) {
    try {
      const guildRoleIdCharmverseRoleIdRecord = await createRoleRecord(spaceRole.spaceId);
      await assignRolesToUser(Array.from(userGuildRoleIds), guildRoleIdCharmverseRoleIdRecord, spaceRole.id);

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
      log.debug(`[guild.xyz]: Failed to update roles for userId:${spaceRole.userId}`);
    }
  }
}
