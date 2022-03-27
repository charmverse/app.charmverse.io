import log from 'lib/log';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';
import * as http from 'adapters/http';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import nc from 'next-connect';
import { withSessionRoute } from 'lib/session/withSession';
import { Role } from '@prisma/client';
import { DiscordUser } from './callback/connect';

const handler = nc({
  onError,
  onNoMatch
});

const discordBotToken = process.env.DISCORD_BOT_TOKEN as string;

export interface ImportRolesPayload {
  spaceId: string,
  guildId: string
}

export interface DiscordServerRole {
  id: string
  name: string
  color: number
  hoist: boolean
  icon?: string
  position: number
  permissions: string
  managed: boolean
  mentionable: boolean
  tags?: {
    bot_id?: string
    integration_id?: string
  }[]
}

export interface DiscordGuildMember {
  user?: DiscordUser
  nick?: string
  avatar?: string
  roles: string[]
  joined_at: string
  deaf: boolean
  mute: boolean
  pending?: boolean
  permissions?: string
}

// TODO: Discord member list pagination
async function importRoles (req: NextApiRequest, res: NextApiResponse) {
  const { spaceId, guildId } = req.body as ImportRolesPayload;
  try {
    await prisma.space.update({
      where: {
        id: spaceId
      },
      data: {
        discordServerId: guildId
      }
    });

    const discordServerRoles = await http.GET<DiscordServerRole[]>(`https://discord.com/api/v8/guilds/${guildId}/roles`, undefined, {
      headers: {
        Authorization: `Bot ${discordBotToken}`
      }
    });

    const rolesRecord: Record<string, {discord: DiscordServerRole, charmverse: Role | null}> = {};
    for (const discordServerRole of discordServerRoles) {
      // Skip the @everyone role, this is assigned to all the members of the workspace
      if (discordServerRole.name !== '@everyone') {
        rolesRecord[discordServerRole.id] = {
          discord: discordServerRole,
          charmverse: null
        };
        const existingRole = await prisma.role.findFirst({
          where: {
            name: discordServerRole.name,
            spaceId
          }
        });

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
              createdBy: req.session.user?.id
            }
          });
        }
        else {
          rolesRecord[discordServerRole.id].charmverse = existingRole;
        }
      }
    }

    const discordGuildMembers = await http.GET<DiscordGuildMember[]>(`https://discord.com/api/v8/guilds/${guildId}/members`, undefined, {
      headers: {
        Authorization: `Bot ${discordBotToken}`
      }
    });

    for (const discordGuildMember of discordGuildMembers) {
      // Find the charmverse user whose discord id matches with the guild member
      if (discordGuildMember.user) {
        const charmverseUser = await prisma.user.findFirst({
          where: {
            discordUser: {
              discordId: discordGuildMember.user.id
            }
          }
        });

        if (charmverseUser) {
          // Check if the user has a role in the current space
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
              // If the role was created successfully
              if (roleInRecord?.charmverse) {
                // Check if the user already has the same role
                const charmverseUserExistingRole = await prisma.spaceRoleToRole.findFirst({
                  where: {
                    roleId: roleInRecord.charmverse.id,
                    spaceRoleId: charmverseUserSpaceRole.id!
                  }
                });
                // If the role wasn't already assigned to the charmverse user
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
                          id: charmverseUserSpaceRole.id!
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

    res.status(200).end();
  }
  catch (err) {
    log.warn('Failed to connect workspace with discord server', err);
    res.status(500).end();
  }
}

handler.use(requireUser).post(importRoles);

export default withSessionRoute(handler);
