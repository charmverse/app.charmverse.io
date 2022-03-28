import log from 'lib/log';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import nc from 'next-connect';
import { withSessionRoute } from 'lib/session/withSession';
import { handleDiscordResponse } from 'lib/discord/handleDiscordResponse';
import { findOrCreateRolesFromDiscord } from 'lib/discord/createRoles';
import { assignRolesFromDiscord } from 'lib/discord/assignRoles';
import { DiscordUser } from './connect';

const handler = nc({
  onError,
  onNoMatch
});

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

  await findOrCreateRolesFromDiscord(discordServerRoles, spaceId, req.session.user.id);

  res.status(200).json({ success: true });
}

handler.use(requireUser).use(requireSpaceMembership('admin')).post(importRoles);

export default withSessionRoute(handler);
