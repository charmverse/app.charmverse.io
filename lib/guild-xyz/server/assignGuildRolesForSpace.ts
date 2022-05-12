import { prisma } from 'db';
import log from 'lib/log';
import { getGuildRoleIds } from '../getGuildRoleIds';
import { createRoleRecord } from './createRoleRecord';

export async function assignGuildRolesForSpace (spaceId: string) {
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
        const guildRoleIds = await getGuildRoleIds(addresses);

        const charmverseRoleIds: string[] = [];
        // Filter the roles that are part of the workspace only
        guildRoleIds.forEach(
          guildRoleId => {
            if (guildRoleIdCharmverseRoleIdRecord[guildRoleId]) {
              charmverseRoleIds.push(guildRoleIdCharmverseRoleIdRecord[guildRoleId]);
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
      }
    }
    catch (_) {
      log.debug(`[guild.xyz]: Failed to assign roles for userId:${spaceRole.userId}`);
    }
  }
}
