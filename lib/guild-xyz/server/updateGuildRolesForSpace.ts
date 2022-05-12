import { prisma } from 'db';
import log from 'lib/log';
import { getGuildRoleIds } from '../getGuildRoleIds';
import { assignRolesToUser } from './assignRolesToUser';
import { createRoleRecord } from './createRoleRecord';

export async function updateGuildRolesForSpace (spaceId: string) {
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId
    },
    select: {
      userId: true,
      id: true,
      user: {
        select: {
          addresses: true
        }
      }
    }
  });

  const guildRoleIdCharmverseRoleIdRecord = await createRoleRecord(spaceId);

  for (const spaceRole of spaceRoles) {
    try {
      const addresses = spaceRole.user.addresses;
      // Only proceed further if the user has at least a single address
      if (addresses.length > 0) {
        const userGuildRoleIds = await getGuildRoleIds(addresses);
        await assignRolesToUser(userGuildRoleIds, guildRoleIdCharmverseRoleIdRecord, spaceRole.id);
      }
    }
    catch (_) {
      log.debug(`[guild.xyz]: Failed to update roles for userId:${spaceRole.userId}`);
    }
  }
}
