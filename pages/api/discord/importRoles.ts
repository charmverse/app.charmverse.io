import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import nc from 'next-connect';
import { withSessionRoute } from 'lib/session/withSession';
import { handleDiscordResponse } from 'lib/discord/handleDiscordResponse';
import { findOrCreateRolesFromDiscord, DiscordServerRole } from 'lib/discord/createRoles';
import { assignRolesFromDiscord, DiscordGuildMember } from 'lib/discord/assignRoles';

const handler = nc({
  onError,
  onNoMatch
});

export interface ImportRolesPayload {
  spaceId: string,
  guildId: string,
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
    const guildMember = discordGuildMembersResponse.data[discordGuildMembersResponse.data.length - 1];
    if (!guildMember.user) {
      throw new Error('Guild member does not have a user property');
    }
    lastUserId = guildMember.user.id;
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
