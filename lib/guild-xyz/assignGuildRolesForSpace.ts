import { prisma } from 'db';
import { user } from '@guildxyz/sdk';

export async function assignGuildRolesForSpace (spaceId: string) {
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId
    },
    select: {
      userId: true,
      id: true
    }
  });

  const rolesImportedWithGuild = await prisma.role.findMany({
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

  const guildRoleCharmverseRoleRecord: Record<string, string> = {};
  rolesImportedWithGuild.forEach(roleImportedWithGuild => {
    if (roleImportedWithGuild.sourceId) {
      guildRoleCharmverseRoleRecord[roleImportedWithGuild.sourceId] = roleImportedWithGuild.id;
    }
  });

  const workspaceRoleIdsSet = new Set(rolesImportedWithGuild.map(roleImportedWithGuild => roleImportedWithGuild.sourceId as string));

  for (const spaceRole of spaceRoles) {
    const charmverseUser = await prisma.user.findUnique({
      where: {
        id: spaceRole.userId
      }
    });
    // If the user has a wallet address
    if (charmverseUser?.addresses?.[0]) {
      const memberships = await user.getMemberships(charmverseUser.addresses[0]);
      const roleIdsSet: Set<string> = new Set();
      memberships?.forEach(membership => {
        membership.roleids.forEach(roleid => roleIdsSet.add(String(roleid)));
      });

      // Filter the roles that are part of the workspace only
      const roleIdsInWorkspace = Array.from(roleIdsSet).filter(roleId => workspaceRoleIdsSet.has(roleId));
      for (const roleIdInWorkspace of roleIdsInWorkspace) {
        const roleId = guildRoleCharmverseRoleRecord[roleIdInWorkspace];
        if (roleId) {
          await prisma.spaceRoleToRole.upsert({
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
          });
        }
      }
    }
  }
}
