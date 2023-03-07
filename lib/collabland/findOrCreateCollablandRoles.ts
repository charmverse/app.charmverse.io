import type { Role } from '@prisma/client';
import { RoleSource } from '@prisma/client';

import { prisma } from 'db';
import { getGuildRoles } from 'lib/collabland/collablandClient';
import type { ExternalRole } from 'lib/roles/interfaces';

type RolesRecord = Record<string, Role | null>;

// Create charmverse roles or find them from prisma to generate a final record
export async function findOrCreateCollablandRoles({
  externalRoleIds,
  spaceId,
  userId,
  discordServerId
}: {
  externalRoleIds: string[];
  spaceId: string;
  userId: string;
  discordServerId: string;
}): Promise<RolesRecord> {
  const rolesRecord: RolesRecord = {};
  let discordRoles: ExternalRole[] | null = null;

  for (const externalRoleId of externalRoleIds) {
    // First check if discord role already exists in db
    const existingRole = await prisma.role.findFirst({
      where: {
        OR: [
          {
            externalId: String(externalRoleId),
            spaceId
          },
          {
            sourceId: String(externalRoleId),
            spaceId
          }
        ]
      }
    });

    if (existingRole) {
      rolesRecord[externalRoleId] = existingRole;
    } else {
      // fetch discord roles only once and only when needed
      if (!discordRoles) {
        discordRoles = await getGuildRoles(discordServerId);
      }

      const externalRole = discordRoles?.find((role) => role.id === externalRoleId) ?? null;
      if (externalRole) {
        const newRoleData = {
          name: externalRole.name,
          space: {
            connect: {
              id: spaceId
            }
          },
          createdBy: userId,
          source: RoleSource.collabland,
          sourceId: String(externalRole.id),
          externalId: String(externalRole.id)
        };

        const createdRole = await prisma.role.create({
          data: newRoleData
        });

        rolesRecord[externalRole.id] = createdRole;
      }
    }
  }

  return rolesRecord;
}
