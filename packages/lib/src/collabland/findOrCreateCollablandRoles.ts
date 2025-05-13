import type { Role } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { syncDiscordRoles } from '@packages/lib/discord/collabland/syncDiscordRoles';

type RolesRecord = Record<string, Role | null>;

// Create charmverse roles or find them from prisma to generate a final record
export async function findOrCreateCollablandRoles({
  externalRoleIds,
  spaceId
}: {
  externalRoleIds: string[];
  spaceId: string;
  userId: string;
}): Promise<RolesRecord> {
  const rolesRecord: RolesRecord = {};

  for (const externalRoleId of externalRoleIds) {
    // First check if discord role already exists in db
    let existingRole = await getExistingRole({ externalId: externalRoleId, spaceId });

    if (existingRole) {
      rolesRecord[externalRoleId] = existingRole;
    } else {
      // sync discord roles only once and only when needed
      await syncDiscordRoles({ spaceId });
      existingRole = await getExistingRole({ externalId: externalRoleId, spaceId });

      // if role does not exist after sync, it might be invalid so we ignore it
      if (existingRole?.externalId) {
        rolesRecord[existingRole.externalId] = existingRole;
      }
    }
  }

  return rolesRecord;
}

async function getExistingRole({ spaceId, externalId }: { spaceId: string; externalId: string }) {
  return prisma.role.findFirst({
    where: {
      OR: [
        {
          externalId: String(externalId),
          spaceId
        },
        {
          sourceId: String(externalId),
          spaceId
        }
      ]
    }
  });
}
