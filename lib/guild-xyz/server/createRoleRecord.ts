import { prisma } from '@charmverse/core/prisma-client';

export async function createRoleRecord(spaceId: string) {
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
  rolesImportedFromGuild.forEach((roleImportedFromGuild) => {
    guildRoleIdCharmverseRoleIdRecord[roleImportedFromGuild.sourceId as string] = roleImportedFromGuild.id;
  });

  return guildRoleIdCharmverseRoleIdRecord;
}
