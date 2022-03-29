import { Role } from '@prisma/client';
import { DiscordGuildMember, DiscordServerRole } from 'pages/api/discord/importRoles';
import { prisma } from 'db';

export async function assignRolesFromDiscord (rolesRecord: Record<string,
  { discord: DiscordServerRole, charmverse: Role | null }>, discordGuildMembers: DiscordGuildMember[], spaceId: string) {

  for (const discordGuildMember of discordGuildMembers) {
    // No need to add role for a bot
    if (discordGuildMember.user && !discordGuildMember.user.bot) {
      // Find the charmverse user whose discord id matches with the guild member
      const charmverseUser = await prisma.user.findFirst({
        where: {
          discordUser: {
            discordId: discordGuildMember.user.id
          }
        }
      });

      // Some user might not have connected with discord
      if (charmverseUser) {
        // Check if the user has a role in the current space, this is to ensure that the user belongs to this space
        const charmverseUserSpaceRole = await prisma.spaceRole.findFirst({
          where: {
            spaceId,
            userId: charmverseUser.id
          }
        });

        // If the user is a part of the workspace assign the role to that user
        if (charmverseUserSpaceRole) {
          // Loop through all the roles the discord user has
          for (const role of discordGuildMember.roles) {
            const roleInRecord = rolesRecord[role];
            // If the role was created/fetched successfully
            if (roleInRecord?.charmverse) {
              // Check if the user already has the same role
              const charmverseUserExistingRole = await prisma.spaceRoleToRole.findFirst({
                where: {
                  roleId: roleInRecord.charmverse.id,
                  spaceRoleId: charmverseUserSpaceRole.id
                }
              });
              // Only assign the role if the role wasn't already assigned to the charmverse user
              if (!charmverseUserExistingRole) {
                await prisma.spaceRoleToRole.create({
                  data: {
                    role: {
                      connect: {
                        id: roleInRecord.charmverse.id
                      }
                    },
                    spaceRole: {
                      connect: {
                        id: charmverseUserSpaceRole.id
                      }
                    }
                  }
                });
              }
            }
          }
        }
      }
    }
  }
}
