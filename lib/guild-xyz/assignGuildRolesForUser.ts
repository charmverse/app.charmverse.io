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
    const guildUserRoleIds: string[] = [];
    guildMemberships?.forEach(membership => {
      guildUserRoleIds.push(...membership.roleids.map(roleid => String(roleid)));
    });

    for (const spaceRole of spaceRoles) {
      // Get all the roles import from guild in this space
      const rolesImportedFromGuild = await prisma.role.findMany({
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
      rolesImportedFromGuild.forEach(roleImportedWithGuild => {
        if (roleImportedWithGuild.sourceRoleId) {
          guildRoleCharmverseRoleRecord[roleImportedWithGuild.sourceRoleId] = roleImportedWithGuild.id;
        }
      });

      const workspaceGuildRoleIdsSet = new Set(rolesImportedFromGuild.map(roleImportedFromGuild => roleImportedFromGuild.sourceRoleId as string));

      // Filter the roles that have been imported from guild but user dont have access to, this could mean the user lost access to it
      const guildRolesUserLostAccess = Array.from(
        workspaceGuildRoleIdsSet
      ).filter(
        workspaceGuildRoleId => !guildUserRoleIds.includes(workspaceGuildRoleId)
      );

      for (const guildRoleId of guildUserRoleIds) {
        const roleId = guildRoleCharmverseRoleRecord[guildRoleId];
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

      // Delete all the guild imported roles the user don't have access to
      for (const guildRoleUserLostAccess of guildRolesUserLostAccess) {
        const roleId = guildRoleCharmverseRoleRecord[guildRoleUserLostAccess];
        if (roleId) {
          const spaceRoleToRole = await prisma.spaceRoleToRole.findUnique({
            where: {
              spaceRoleId_roleId: {
                roleId,
                spaceRoleId: spaceRole.id
              }
            }
          });
          // Only delete if the space role to role exist otherwise prisma will throw an error
          if (spaceRoleToRole) {
            await prisma.spaceRoleToRole.delete({
              where: {
                spaceRoleId_roleId: {
                  roleId,
                  spaceRoleId: spaceRole.id
                }
              }
            });
          }
        }
      }
    }
  }
}
