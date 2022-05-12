import { prisma } from 'db';
import { Role, RoleSource } from '@prisma/client';

type RolesRecord = Record<string, Role | null>;

// Create charmverse roles or find them from prisma to generate a final record
export async function findOrCreateRoles (
  externalRoles: {id: string | number, name: string}[],
  spaceId: string,
  userId: string,
  options?:{source?: RoleSource | null, createRoles?: boolean}
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
          name: externalRole.name,
          spaceId
        }
      });

      let charmVerseRole = existingRole;

      // Only create the role if it doesn't already exist
      if (createRoles) {
        charmVerseRole = await prisma.role.upsert({
          where: {
            spaceId_name: {
              spaceId,
              name: externalRole.name
            }
          },
          update: {
            name: externalRole.name,
            space: {
              connect: {
                id: spaceId
              }
            },
            createdBy: userId
          },
          create: {
            name: externalRole.name,
            space: {
              connect: {
                id: spaceId
              }
            },
            createdBy: userId,
            source,
            // If there is a source, store the source role id for future reference
            sourceId: source !== null ? String(externalRole.id) : null
          }
        });
      }

      rolesRecord[externalRole.id] = charmVerseRole;
    }
  }
  return rolesRecord;
}
