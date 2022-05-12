import { prisma } from 'db';
import { user } from '@guildxyz/sdk';
import log from 'lib/log';

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

  const rolesImportedFromGuild = await prisma.role.findMany({
    where: {
      spaceId,
      source: 'guild_xyz',
      sourceId: {
        not: null
      }
    },
    select: {
      sourceId: true,
      id: true
    }
  });

  const guildRoleIdCharmverseRoleIdRecord: Record<string, string> = {};
  rolesImportedFromGuild.forEach(roleImportedFromGuild => {
    if (roleImportedFromGuild.sourceId) {
      guildRoleIdCharmverseRoleIdRecord[roleImportedFromGuild.sourceId] = roleImportedFromGuild.id;
    }
  });

  for (const spaceRole of spaceRoles) {
    try {
      const addresses = spaceRole.user.addresses;
      // Only proceed further if the user has at least a single address
      if (addresses.length > 0) {
        const guildRoleIds: string[] = [];
        // Get all the guild roles associated with all of the addresses of the user
        const guildMembershipsResponses = await Promise.all(addresses.map(address => user.getMemberships(address)));
        guildMembershipsResponses.forEach(guildMembershipsResponse => {
          guildMembershipsResponse?.forEach(guildMemberships => {
            guildRoleIds.push(...guildMemberships.roleids.map(String));
          });
        });

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
      log.debug(`[guild.xyz]: Failed to import roles for userId:${spaceRole.userId}`);
    }
  }
}
