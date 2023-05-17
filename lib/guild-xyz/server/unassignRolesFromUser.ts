import { prisma } from '@charmverse/core/prisma-client';

export async function unassignRolesFromUser({
  guildRoleIdCharmverseRoleIdRecord,
  spaceRoleId,
  userGuildRoleIds,
  userGuildRoleIdsInSpace
}: {
  userGuildRoleIdsInSpace: string[];
  userGuildRoleIds: string[];
  spaceRoleId: string;
  guildRoleIdCharmverseRoleIdRecord: Record<string, string>;
}) {
  // Filter the roles that have been imported from guild but user dont have access to, this could mean the user lost access to it
  const roleIdsUserLostAccess: string[] = [];

  userGuildRoleIdsInSpace.forEach((userGuildRoleIdInSpace) => {
    // If the user currently dont have access to this guild role
    if (!userGuildRoleIds.includes(userGuildRoleIdInSpace)) {
      roleIdsUserLostAccess.push(guildRoleIdCharmverseRoleIdRecord[userGuildRoleIdInSpace]);
    }
  });

  await prisma.$transaction(
    roleIdsUserLostAccess.map((charmverseRoleId) =>
      prisma.spaceRoleToRole.delete({
        where: {
          spaceRoleId_roleId: {
            roleId: charmverseRoleId,
            spaceRoleId
          }
        }
      })
    )
  );
}
