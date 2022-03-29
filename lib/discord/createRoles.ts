import { DiscordServerRole } from 'pages/api/discord/importRoles';
import { prisma } from 'db';
import { Role } from '@prisma/client';

type RolesRecord = Record<string, { discord: DiscordServerRole, charmverse: Role }>;

// Create charmverse roles from discord roles
export async function findOrCreateRolesFromDiscord (discordServerRoles: DiscordServerRole[], spaceId: string, userId: string): Promise<RolesRecord> {
  const rolesRecord: RolesRecord = {};
  // Create all of the discord roles fist
  for (const discordServerRole of discordServerRoles) {
    // Skip the @everyone role, this is assigned to all the members of the workspace
    if (discordServerRole.name !== '@everyone') {
      let charmVerseRole: Role | null = null;
      // First check if a role with the same name already exist in the workspace
      const existingRole = await prisma.role.findFirst({
        where: {
          name: discordServerRole.name,
          spaceId
        }
      });

      // Only create the role if it doesn't already exist
      if (!existingRole) {
        charmVerseRole = await prisma.role.create({
          data: {
            name: discordServerRole.name,
            space: {
              connect: {
                id: spaceId
              }
            },
            createdBy: userId
          }
        });
      }
      else {
        charmVerseRole = existingRole;
      }

      rolesRecord[discordServerRole.id] = {
        discord: discordServerRole,
        charmverse: charmVerseRole
      };
    }
  }
  return rolesRecord;
}
