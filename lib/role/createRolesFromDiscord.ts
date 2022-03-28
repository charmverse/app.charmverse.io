import { DiscordServerRole } from 'pages/api/discord/importRoles';
import { prisma } from 'db';
import { Role } from '@prisma/client';

// Create charmverse roles from discord roles
export async function createRolesFromDiscord (discordServerRoles: DiscordServerRole[], spaceId: string, userId: string) {
  const failedRoles: string[] = [];
  const rolesRecord: Record<string, { discord: DiscordServerRole, charmverse: Role | null }> = {};
  // Create all of the discord roles fist
  for (const discordServerRole of discordServerRoles) {
    // Skip the @everyone role, this is assigned to all the members of the workspace
    if (discordServerRole.name !== '@everyone') {
      rolesRecord[discordServerRole.id] = {
        discord: discordServerRole,
        charmverse: null
      };
      try {
        // First check if a role with the same name already exist in the workspace
        const existingRole = await prisma.role.findFirst({
          where: {
            name: discordServerRole.name,
            spaceId
          }
        });
        // IMPORTANT: Remove this from production !!! THIS IS ONLY FOR TESTING PURPOSE
        // if (discordServerRole.name === 'error') {
        //   throw new Error();
        // }

        // Only create the role if it doesn't already exist
        if (!existingRole) {
          rolesRecord[discordServerRole.id].charmverse = await prisma.role.create({
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
          rolesRecord[discordServerRole.id].charmverse = existingRole;
        }
      }
      catch (_) {
        failedRoles.push(discordServerRole.name);
      }
    }
  }
  return {
    failedRoles,
    rolesRecord
  };
}
