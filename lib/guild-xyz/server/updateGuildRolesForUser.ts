import { Role, SpaceRole } from '@prisma/client';
import log from 'lib/log';
import { getGuildRoleIds } from '../getGuildRoleIds';
import { createRoleRecord } from './createRoleRecord';
import { assignRolesToUser } from './assignRolesToUser';
import { unassignRolesFromUser } from './unassignRolesFromUser';

export async function updateGuildRolesForUser (addresses: string[], spaceRoles: (Pick<SpaceRole, 'spaceId' | 'id' | 'userId'> & {
  // Using the most strict/narrow types to make it easier to test
  spaceRoleToRole: {
      role: Pick<Role, 'source' | 'sourceId'>;
    }[];
  })[]) {
  const workspaceHasGuildImportedRoles = Boolean(spaceRoles.find(spaceRole => spaceRole.spaceRoleToRole.find(spaceRoleToRole => spaceRoleToRole.role.source === 'guild_xyz' && spaceRoleToRole.role.sourceId !== null)));

  if (workspaceHasGuildImportedRoles) {
    try {
      const userGuildRoleIds = await getGuildRoleIds(addresses);
      for (const spaceRole of spaceRoles) {
        const guildRoleIdCharmverseRoleIdRecord = await createRoleRecord(spaceRole.spaceId);
        await assignRolesToUser(userGuildRoleIds, guildRoleIdCharmverseRoleIdRecord, spaceRole.id);
        await unassignRolesFromUser({
          userGuildRoleIdsInSpace: spaceRole.spaceRoleToRole.filter(spaceRoleToRole => spaceRoleToRole.role.source === 'guild_xyz').map(spaceRoleToRole => spaceRoleToRole.role.sourceId as string),
          userGuildRoleIds,
          guildRoleIdCharmverseRoleIdRecord,
          spaceRoleId: spaceRole.id
        });
      }
    }
    catch (err) {
      log.warn('[guild.xyz]: Failed to import guild.xyz roles', err);
    }
  }
}
