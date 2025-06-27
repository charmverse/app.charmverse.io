import type { Role, SpaceRole } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';

import { getGuildRoleIds } from '../getGuildRoleIds';

import { assignRolesToUser } from './assignRolesToUser';
import { createRoleRecord } from './createRoleRecord';
import { unassignRolesFromUser } from './unassignRolesFromUser';

export async function updateGuildRolesForUser(
  addresses: string[],
  spaceRoles: (Pick<SpaceRole, 'spaceId' | 'id' | 'userId'> & {
    // Using the most strict/narrow types to make it easier to test
    spaceRoleToRole: {
      role: Pick<Role, 'source' | 'sourceId'>;
    }[];
  })[]
) {
  // Find the first guild.xyz imported role in all the workspace the user is part of
  const userWorkspaceRoleImportFromGuild = await prisma.role.findFirst({
    where: {
      spaceId: {
        in: spaceRoles.map((spaceRole) => spaceRole.spaceId)
      },
      source: 'guild_xyz',
      sourceId: {
        not: null
      }
    }
  });

  if (userWorkspaceRoleImportFromGuild) {
    try {
      const userGuildRoleIds = await getGuildRoleIds(addresses);
      for (const spaceRole of spaceRoles) {
        const guildRoleIdCharmverseRoleIdRecord = await createRoleRecord(spaceRole.spaceId);
        await assignRolesToUser(userGuildRoleIds, guildRoleIdCharmverseRoleIdRecord, spaceRole.id);
        await unassignRolesFromUser({
          userGuildRoleIdsInSpace: spaceRole.spaceRoleToRole
            .filter((spaceRoleToRole) => spaceRoleToRole.role.source === 'guild_xyz')
            .map((spaceRoleToRole) => spaceRoleToRole.role.sourceId as string),
          userGuildRoleIds,
          guildRoleIdCharmverseRoleIdRecord,
          spaceRoleId: spaceRole.id
        });
      }
    } catch (error) {
      log.warn('[guild.xyz]: Failed to import guild.xyz roles', { error: (error as Error).stack || error });
    }
  }
}
