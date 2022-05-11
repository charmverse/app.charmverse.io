import { prisma } from 'db';
import { user } from '@guildxyz/sdk';
import { SpaceRole } from '@prisma/client';

export async function assignGuildRolesForUser (userId: string, firstAddress?: string, _spaceRoles?: SpaceRole[]) {
  firstAddress = firstAddress ?? (await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      addresses: true
    }
  }))?.addresses?.[0];

  if (firstAddress) {
    // Find all the space this user is part of
    const spaceRoles = _spaceRoles ?? await prisma.spaceRole.findMany({
      where: {
        userId
      },
      select: {
        id: true,
        spaceId: true
      }
    });
    const guildMemberships = await user.getMemberships(firstAddress);

    for (const spaceRole of spaceRoles) {
      // Get all the roles import from guild in this space
      const rolesImportedWithGuild = await prisma.role.findMany({
        where: {
          spaceId: spaceRole.spaceId,
          source: 'guild.xyz',
          sourceRoleId: {
            not: null
          }
        },
        select: {
          sourceRoleId: true,
          id: true
        }
      });
      // Create a map between [guild role id]: charmverse role id
      const guildRoleCharmverseRoleRecord: Record<string, string> = {};
      rolesImportedWithGuild.forEach(roleImportedWithGuild => {
        if (roleImportedWithGuild.sourceRoleId) {
          guildRoleCharmverseRoleRecord[roleImportedWithGuild.sourceRoleId] = roleImportedWithGuild.id;
        }
      });

      const workspaceRoleIdsSet = new Set(rolesImportedWithGuild.map(roleImportedWithGuild => roleImportedWithGuild.sourceRoleId as string));
      const roleIdsSet: Set<string> = new Set();
      guildMemberships?.forEach(membership => {
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
