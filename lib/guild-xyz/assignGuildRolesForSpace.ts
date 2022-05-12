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

  const guildImportedRoleIdsInWorkspace = new Set(rolesImportedFromGuild.map(roleImportedWithGuild => roleImportedWithGuild.sourceId as string));

  for (const spaceRole of spaceRoles) {
    try {
      const addresses = spaceRole.user.addresses;
      // Only proceed further if the user has at least a single address
      if (addresses.length > 0) {
        const guildRoleIdsSet: Set<string> = new Set();
        // Get all the guild roles associated with all of the addresses of the user
        for (const address of addresses) {
          const guildMemberships = await user.getMemberships(address);
          guildMemberships?.forEach(guildMembership => {
            guildMembership.roleids.forEach(roleid => guildRoleIdsSet.add(String(roleid)));
          });
        }

        // Filter the roles that are part of the workspace only
        const roleIds = Array.from(guildRoleIdsSet).filter(
          guildRoleId => guildImportedRoleIdsInWorkspace.has(guildRoleId)
        ).map(
          guildRoleId => guildRoleIdCharmverseRoleIdRecord[guildRoleId]
        );

        await prisma.$transaction(roleIds.map(roleId => prisma.spaceRoleToRole.upsert({
          where: {
            spaceRoleId_roleId: {
              roleId,
              spaceRoleId: spaceRole.id
            }
          },
          update: {},
          create: {
            role: {
              connect: {
                id: roleId
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
