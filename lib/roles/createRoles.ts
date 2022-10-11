import type { Role, RoleSource } from '@prisma/client';

import { prisma } from 'db';

type RolesRecord = Record<string, Role | null>;

// Create charmverse roles or find them from prisma to generate a final record
export async function findOrCreateRoles (
  externalRoles: { id: string | number, name: string }[],
  spaceId: string,
  userId: string,
  options?:{ source?: RoleSource | null, createRoles?: boolean }
): Promise<RolesRecord> {
  const { createRoles = true, source = null } = options ?? {};
  const rolesRecord: RolesRecord = {};
  // Create all of the discord roles fist
  for (const externalRole of externalRoles) {
    // Skip the @everyone role, this is assigned to all the members of the server
    if (externalRole.name !== '@everyone') {
      // First check if a role with the same name already exist in the workspace
      const existingRole = await prisma.role.findFirst({
        where: {
          OR: [
            {
              name: externalRole.name,
              spaceId
            },
            {
              sourceId: String(externalRole.id),
              spaceId
            }
          ]
        }
      });

      let charmVerseRole = existingRole;

      // Only create the role if it doesn't already exist
      if (createRoles) {
        const upsertData = {
          name: externalRole.name,
          space: {
            connect: {
              id: spaceId
            }
          },
          createdBy: userId,
          source,
          sourceId: source !== null ? String(externalRole.id) : null
        };

        if (existingRole) {
          charmVerseRole = await prisma.role.update({
            where: {
              id: existingRole.id
            },
            data: upsertData
          });
        }
        else {
          charmVerseRole = await prisma.role.create({
            data: upsertData
          });
        }
      }

      rolesRecord[externalRole.id] = charmVerseRole;
    }
  }
  return rolesRecord;
}
