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
  guildId: string,
  discordUserId: string
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
  const { spaceId, guildId, discordUserId } = req.body as ImportRolesPayload;
  const importErrors: ImportRolesResponse['error'] = [];

  if (!spaceId || !guildId || !discordUserId) {
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
  }
  catch (err) {
    log.warn('Failed to connect workspace with discord server', err);
    res.status(500).json({ error: 'Failed to connect workspace with discord server' });
    return;
  }

  let discordServerRoles: DiscordServerRole[] = [];
  // TODO: Handle when the bot doesn't have the right permissions
  try {
    discordServerRoles = await http.GET<DiscordServerRole[]>(`https://discord.com/api/v8/guilds/${guildId}/roles`, undefined, {
      headers: {
        Authorization: `Bot ${discordBotToken}`
      }
    });
  }
  catch (err: any) {
    // The bot token is invalid
    if (err.code === 0) {
      log.warn('Bot is unauthorized due to invalid token', err);
      res.status(500).json({ error: 'Something went wrong. Please try again' });
      return;
    }
    // Charmverse bot hasn't been added to server
    else if (err.code === 50001) {
      res.status(500).json({ error: 'Please add Charmverse bot to your server' });
      return;
    }
    // Guild doesn't exist
    else if (err.code === 10004) {
      res.status(500).json({ error: "Unknown guild. Please make sure you're importing from the correct guild" });
      return;
    }
    else {
      res.status(500).json({ error: 'Something went wrong. Please try again' });
      return;
    }
  }

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

handler.use(requireUser).use(requireSpaceMembership('admin')).post(importRoles);

export default withSessionRoute(handler);
