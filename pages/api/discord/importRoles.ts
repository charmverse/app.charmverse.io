import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import nc from 'next-connect';
import { withSessionRoute } from 'lib/session/withSession';
import { handleDiscordResponse } from 'lib/discord/handleDiscordResponse';
import { findOrCreateRoles } from 'lib/roles/createRoles';
import { assignRolesFromDiscord, DiscordGuildMember } from 'lib/discord/assignRoles';
import { DiscordServerRole } from 'lib/discord/interface';
import { RateLimit } from 'async-sema';

const handler = nc({
  onError,
  onNoMatch
});

export interface ImportDiscordRolesPayload {
  spaceId: string,
  guildId: string,
}

export type ImportRolesResponse = { importedRoleCount: number };

// requests per second = 10, timeUnit = 1sec
const rateLimiter = RateLimit(10);

const MEMBERS_PER_REQUEST = 100;

async function importRoles (req: NextApiRequest, res: NextApiResponse<ImportRolesResponse | { error: string }>) {
  const { spaceId, guildId } = req.body as ImportDiscordRolesPayload;

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
  let discordGuildMembersResponse = await handleDiscordResponse<DiscordGuildMember[]>(`https://discord.com/api/v8/guilds/${guildId}/members?limit=${MEMBERS_PER_REQUEST}`);

  while (discordGuildMembersResponse.status === 'success' && discordGuildMembersResponse.data.length > 0) {
    discordGuildMembers.push(...discordGuildMembersResponse.data);
    const guildMember = discordGuildMembersResponse.data[discordGuildMembersResponse.data.length - 1];
    if (!guildMember.user) {
      throw new Error('Guild member does not have a user property');
    }
    lastUserId = guildMember.user.id;
    discordGuildMembersResponse = await handleDiscordResponse<DiscordGuildMember[]>(`https://discord.com/api/v8/guilds/${guildId}/members?limit=${MEMBERS_PER_REQUEST}&after=${lastUserId}`);
    await rateLimiter();
  }

  if (discordGuildMembersResponse.status !== 'success') {
    res.status(discordGuildMembersResponse.status).json({ error: discordGuildMembersResponse.error });
  }
  else {
    const rolesRecord = await findOrCreateRoles(discordServerRoles, spaceId, req.session.user.id);
    // Remove the roles imported from guild.xyz
    for (const roleId of Object.keys(rolesRecord)) {
      const role = rolesRecord[roleId];
      if (role?.sourceId && role.source === 'guild_xyz') {
        delete rolesRecord[roleId];
      }
    }
    await assignRolesFromDiscord(rolesRecord, discordGuildMembers, spaceId);
    res.status(200).json({ importedRoleCount: discordServerRoles.length });
  }
}

handler.use(requireUser).use(requireSpaceMembership({ adminOnly: true })).post(importRoles);

export default withSessionRoute(handler);
