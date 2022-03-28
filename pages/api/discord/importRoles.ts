import log from 'lib/log';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';
import * as http from 'adapters/http';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import nc from 'next-connect';
import { withSessionRoute } from 'lib/session/withSession';
import { Role } from '@prisma/client';
import { handleDiscordResponse } from 'lib/discord/handleDiscordResponse';
import { DiscordUser } from './connect';

const handler = nc({
  onError,
  onNoMatch
});

const discordBotToken = process.env.DISCORD_BOT_TOKEN as string;

export interface ImportRolesPayload {
  spaceId: string,
  guildId: string,
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
  error?: ({
    action: 'create',
    role: string
  } | {
    action: 'assign',
    username: string,
    roles: string[]
  })[] | string
}

async function importRoles (req: NextApiRequest, res: NextApiResponse<ImportRolesResponse>) {
  const { spaceId, guildId } = req.body as ImportRolesPayload;
  const importErrors: ImportRolesResponse['error'] = [];

  if (!spaceId || !guildId) {
    res.status(400).json({
      error: 'Missing parameters'
    });
    return;
  }

  const userId = req.session.user.id;
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      discordUser: true
    }
  });

  if (!user?.discordUser) {
    res.status(401).json({
      error: 'You must have discord connected'
    });
    return;
  }

  const discordApiHeaders: any = {
    headers: {
      Authorization: `Bot ${discordBotToken}`
    }
  };

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

  const discordServerRoles: DiscordServerRole[] = [];
  const discordGuildMembers: DiscordGuildMember[] = [];

  const discordServerRolesResponse = await handleDiscordResponse<DiscordServerRole[]>(`https://discord.com/api/v8/guilds/${guildId}/roles`);

  if (discordServerRolesResponse.status === 'success') {
    discordServerRoles.push(...discordServerRolesResponse.data);
  }
  else {
    res.status(discordServerRolesResponse.status).json({ error: discordServerRolesResponse.error });
    return;
  }

  let lastUserId = '0';
  let discordGuildMembersResponse = await handleDiscordResponse<DiscordGuildMember[]>(`https://discord.com/api/v8/guilds/${guildId}/members?limit=100`);

  // eslint-disable-next-line
  while (true) {
    if (discordGuildMembersResponse.status === 'success') {
      if (discordGuildMembersResponse.data.length === 0) {
        break;
      }
      discordGuildMembers.push(...discordGuildMembersResponse.data);
      lastUserId = discordGuildMembersResponse.data[discordGuildMembersResponse.data.length - 1].user?.id!;
      discordGuildMembersResponse = await handleDiscordResponse<DiscordGuildMember[]>(`https://discord.com/api/v8/guilds/${guildId}/members?limit=100&after=${lastUserId}`);
    }
    else {
      res.status(discordGuildMembersResponse.status).json({ error: discordGuildMembersResponse.error });
      return;
    }
  }

  const discordMember = discordGuildMembers.find(guildMember => guildMember.user?.id === user.discordUser!.discordId);
  if (!discordMember) {
    res.status(401).json({
      error: 'You are not part of the guild'
    });
    return;
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
          role: discordServerRole.name
        });
      }
    }
  }

  for (const discordGuildMember of discordGuildMembers) {
    const unassignedRoles: string[] = [];
    try {
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
              try {
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
                else {
                  // We couldn't create the role so it wont be assigned
                  unassignedRoles.push(roleInRecord?.discord.name);
                }
              }
              catch (_) {
                unassignedRoles.push(roleInRecord?.discord.name);
              }
            }
          }
        }
      }
    }
    catch (_) {
      // This block will be reached if
      // 1. User doesn't have a charmverse account connected with discord
      // 2. User is not part of the charmverse workspace
    }

    if (unassignedRoles.length !== 0) {
      importErrors.push({
        action: 'assign',
        username: discordGuildMember.user?.username ?? 'N/A',
        roles: unassignedRoles
      });
    }
  }

  res.status(200).json({
    error: importErrors
  });
}

handler.use(requireUser).use(requireSpaceMembership('admin')).post(importRoles);

export default withSessionRoute(handler);
