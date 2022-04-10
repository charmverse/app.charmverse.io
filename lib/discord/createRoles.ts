import { DiscordServerRole } from 'pages/api/discord/importRoles';
import { prisma } from 'db';
import { Role } from '@prisma/client';
import log from 'lib/log';

type RolesRecord = Record<string, { discord: DiscordServerRole, charmverse: Role | null }>;

// Create charmverse roles from discord roles
export async function findOrCreateRolesFromDiscord (
  discordServerRoles: DiscordServerRole[],
  spaceId: string,
  userId: string,
  createRoles?: boolean
): Promise<RolesRecord> {
  let roleWithIssue : string | null = null;
  createRoles = createRoles ?? true;
  const rolesRecord: RolesRecord = {};
  // Create all of the discord roles fist
  for (const discordServerRole of discordServerRoles) {
    // Skip the @everyone role, this is assigned to all the members of the server
    if (discordServerRole.name !== '@everyone') {
      // First check if a role with the same name already exist in the workspace
      const existingRole = await prisma.role.findFirst({
        where: {
          name: discordServerRole.name,
          spaceId
        }
      });

      let charmVerseRole = existingRole;

      // Only create the role if it doesn't already exist
      if (!existingRole && createRoles) {
        try {
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
        catch (_) {
          roleWithIssue = discordServerRole.name;
        }
      }

      rolesRecord[discordServerRole.id] = {
        discord: discordServerRole,
        charmverse: charmVerseRole
      };
    }
  }
  if (roleWithIssue) {
    log.error(`Error creating role ${roleWithIssue}. Roles: ${discordServerRoles.map(discordServerRole => discordServerRole.name).join(',')}`);
  }
  return rolesRecord;
}
