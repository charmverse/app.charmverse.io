import log from 'lib/log';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import nc from 'next-connect';
import { withSessionRoute } from 'lib/session/withSession';
import { handleDiscordResponse } from 'lib/discord/handleDiscordResponse';
import { findOrCreateRolesFromDiscord } from 'lib/discord/createRoles';
import { assignRolesFromDiscord } from 'lib/discord/assignRoles';
import { DiscordAccount } from './connect';

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
  user?: DiscordAccount
  nick?: string
  avatar?: string
  roles: string[]
  joined_at: string
  deaf: boolean
  mute: boolean
  pending?: boolean
  permissions?: string
}

export type ImportRolesResponse = { importedRoleCount: number };

async function importRoles (req: NextApiRequest, res: NextApiResponse<ImportRolesResponse | { error: string }>) {
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

  await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      discordServerId: guildId
    }
  });

  const discordServerRoles: DiscordServerRole[] = [];
  const discordGuildMembers: DiscordGuildMember[] = [];

  const discordServerRolesResponse = await handleDiscordResponse<DiscordServerRole[]>(`https://discord.com/api/v8/guilds/${guildId}/roles`);

  if (discordServerRolesResponse.status === 'success') {
    discordServerRoles.push(...discordServerRolesResponse.data);
  }
  else {
    res.status(discordServerRolesResponse.status).json(discordServerRolesResponse);
    return;
  }

  let lastUserId = '0';
  let discordGuildMembersResponse = await handleDiscordResponse<DiscordGuildMember[]>(`https://discord.com/api/v8/guilds/${guildId}/members?limit=100`);

  while (discordGuildMembersResponse.status === 'success' && discordGuildMembersResponse.data.length > 0) {
    discordGuildMembers.push(...discordGuildMembersResponse.data);
    lastUserId = discordGuildMembersResponse.data[discordGuildMembersResponse.data.length - 1].user?.id!;
    discordGuildMembersResponse = await handleDiscordResponse<DiscordGuildMember[]>(`https://discord.com/api/v8/guilds/${guildId}/members?limit=100&after=${lastUserId}`);
  }

  if (discordGuildMembersResponse.status !== 'success') {
    res.status(discordGuildMembersResponse.status).json({ error: discordGuildMembersResponse.error });
  }
  else {
    const rolesRecord = await findOrCreateRolesFromDiscord(discordServerRoles, spaceId, req.session.user.id);
    await assignRolesFromDiscord(rolesRecord, discordGuildMembers, spaceId);
    res.status(200).json({ importedRoleCount: discordServerRoles.length });
  }
}

handler.use(requireUser).use(requireSpaceMembership('admin')).post(importRoles);

export default withSessionRoute(handler);
