import { Role } from '@prisma/client';
import { prisma } from 'db';
import { user } from '@guildxyz/sdk';

export async function assignRolesFromGuild (rolesRecord: Record<string, Role | null>, spaceId: string) {
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
      source: 'guild.xyz',
      sourceRoleId: {
        not: null
      }
    },
    select: {
      sourceRoleId: true
    }
  });

  const workspaceRoleIdsSet = new Set(rolesImportedWithGuild.map(roleImportedWithGuild => roleImportedWithGuild.sourceRoleId as string));

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
        const roleRecordItem = rolesRecord[roleIdInWorkspace];
        if (roleRecordItem) {
          await prisma.spaceRoleToRole.upsert({
            where: {
              spaceRoleId_roleId: {
                roleId: roleRecordItem.id,
                spaceRoleId: spaceRole.id
              }
            },
            update: {},
            create: {
              role: {
                connect: {
                  id: roleRecordItem.id
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
