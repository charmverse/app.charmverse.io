import { prisma } from 'db';
import { Role } from '@prisma/client';

type RolesRecord = Record<string, Role | null>;

// Create charmverse roles or find them from prisma to generate a final record
export async function findOrCreateRoles (
  serverRoles: {id: string, name: string}[],
  spaceId: string,
  userId: string,
  createRoles?: boolean
): Promise<RolesRecord> {
  createRoles = createRoles ?? true;
  const rolesRecord: RolesRecord = {};
  // Create all of the discord roles fist
  for (const serverRole of serverRoles) {
    // Skip the @everyone role, this is assigned to all the members of the server
    if (serverRole.name !== '@everyone') {
      // First check if a role with the same name already exist in the workspace
      const existingRole = await prisma.role.findFirst({
        where: {
          name: serverRole.name,
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
              name: serverRole.name
            }
          },
          update: {
            name: serverRole.name,
            space: {
              connect: {
                id: spaceId
              }
            },
            createdBy: userId
          },
          create: {
            name: serverRole.name,
            space: {
              connect: {
                id: spaceId
              }
            },
            createdBy: userId
          }
        });
      }

      rolesRecord[serverRole.id] = charmVerseRole;
    }
  }
  return rolesRecord;
}
