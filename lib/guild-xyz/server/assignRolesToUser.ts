import { prisma } from '@charmverse/core/prisma-client';

export async function assignRolesToUser(
  userGuildRoleIds: string[],
  guildRoleCharmverseRoleRecord: Record<string, string>,
  spaceRoleId: string
) {
  const charmverseRoleIds: string[] = [];
  // Filter the roles that are part of the workspace only
  userGuildRoleIds.forEach((userGuildRoleId) => {
    if (guildRoleCharmverseRoleRecord[userGuildRoleId]) {
      charmverseRoleIds.push(guildRoleCharmverseRoleRecord[userGuildRoleId]);
    }
  });

  await prisma.$transaction(
    charmverseRoleIds.map((charmverseRoleId) =>
      prisma.spaceRoleToRole.upsert({
        where: {
          spaceRoleId_roleId: {
            roleId: charmverseRoleId,
            spaceRoleId
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
              id: spaceRoleId
            }
          }
        }
      })
    )
  );
}
