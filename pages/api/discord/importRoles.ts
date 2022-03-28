import log from 'lib/log';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';
import * as http from 'adapters/http';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
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

export type ImportRolesResponse = {
  error: {
    action: 'create' | 'assign',
    target: string
  }[] | string
}

// TODO: Discord member list pagination
async function importRoles (req: NextApiRequest, res: NextApiResponse<ImportRolesResponse>) {
  const { spaceId, guildId } = req.body as ImportRolesPayload;
  const importErrors: ImportRolesResponse['error'] = [];

  if (!spaceId || !guildId) {
    res.status(400).json({
      error: 'Missing parameters'
    });
    return;
  }

  try {
    await prisma.space.update({
      where: {
        id: spaceId
      },
      data: {
        discordServerId: guildId
      }
    });

    // TODO: Handle invalid token
    // TODO: Handle when the bot is not in the server
    // TODO: Handle when the bot doesn't have the right permissions
    // TODO: Handle when the guild doesn't exist
    const discordServerRoles = await http.GET<DiscordServerRole[]>(`https://discord.com/api/v8/guilds/${guildId}/roles`, undefined, {
      headers: {
        Authorization: `Bot ${discordBotToken}`
      }
    });

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
        catch (_) {
          importErrors.push({
            action: 'create',
            target: discordServerRole.name
          });
        }
      }
    }

    const discordGuildMembers = await http.GET<DiscordGuildMember[]>(`https://discord.com/api/v8/guilds/${guildId}/members?limit=100`, undefined, {
      headers: {
        Authorization: `Bot ${discordBotToken}`
      }
    });

    for (const discordGuildMember of discordGuildMembers) {
      try {
        if (discordGuildMember.user) {
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
                      spaceRoleId: charmverseUserSpaceRole.id!
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
      catch (_) {
        importErrors.push({
          action: 'assign',
          target: discordGuildMember.user?.username ?? 'N/A'
        });
      }
    }

    res.status(200).json({
      error: importErrors
    });
  }
  catch (err) {
    log.warn('Failed to connect workspace with discord server', err);
    res.status(500).end();
  }
}

handler.use(requireUser).use(requireSpaceMembership('admin')).post(importRoles);

export default withSessionRoute(handler);
