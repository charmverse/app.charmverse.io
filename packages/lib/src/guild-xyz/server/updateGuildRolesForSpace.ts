import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { getGuildRoleIds } from '../getGuildRoleIds';

import { assignRolesToUser } from './assignRolesToUser';
import { createRoleRecord } from './createRoleRecord';
import { unassignRolesFromUser } from './unassignRolesFromUser';

export async function updateGuildRolesForSpace(spaceId: string) {
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId
    },
    select: {
      userId: true,
      id: true,
      user: {
        select: {
          wallets: true
        }
      },
      spaceRoleToRole: {
        select: {
          role: {
            select: {
              source: true,
              sourceId: true
            }
          }
        }
      }
    }
  });

  const guildRoleIdCharmverseRoleIdRecord = await createRoleRecord(spaceId);
  for (const spaceRole of spaceRoles) {
    try {
      const addresses = spaceRole.user.wallets.map((w) => w.address);
      // Only proceed further if the user has at least a single address
      if (addresses.length > 0) {
        const userGuildRoleIds = await getGuildRoleIds(addresses);
        await assignRolesToUser(userGuildRoleIds, guildRoleIdCharmverseRoleIdRecord, spaceRole.id);
        await unassignRolesFromUser({
          userGuildRoleIds,
          guildRoleIdCharmverseRoleIdRecord,
          spaceRoleId: spaceRole.id,
          userGuildRoleIdsInSpace: spaceRole.spaceRoleToRole
            .filter((spaceRoleToRole) => spaceRoleToRole.role.source === 'guild_xyz')
            .map((spaceRoleToRole) => spaceRoleToRole.role.sourceId as string)
        });
      }
    } catch (_) {
      log.debug(`[guild.xyz]: Failed to update roles for userId:${spaceRole.userId}`);
    }
  }
}
