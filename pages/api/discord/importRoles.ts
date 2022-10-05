import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import type { DiscordGuildMember } from 'lib/discord/assignRoles';
import { assignRolesFromDiscord } from 'lib/discord/assignRoles';
import { handleDiscordResponse } from 'lib/discord/handleDiscordResponse';
import type { DiscordServerRole } from 'lib/discord/interface';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { findOrCreateRoles } from 'lib/roles/createRoles';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc({
  onError,
  onNoMatch
});

export interface ImportDiscordRolesPayload {
  spaceId: string;
  guildId: string;
}

export type ImportRolesResponse = { importedRoleCount: number };

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

  const discordConnectedMembers = await prisma.user.findMany({
    where: {
      spaceRoles: {
        some: {
          spaceId
        }
      },
      discordUser: {
        isNot: null
      }
    },
    select: {
      discordUser: {
        select: {
          discordId: true
        }
      },
      id: true
    }
  });

  const discordGuildMemberResponses = await Promise.all(
    discordConnectedMembers.map(
      discordConnectedMember => handleDiscordResponse<DiscordGuildMember>(
        `https://discord.com/api/v8/guilds/${guildId}/members/${discordConnectedMember.discordUser!.discordId}`
      )
    )
  ) as { status: 'success', data: DiscordGuildMember | null }[];

  discordGuildMemberResponses.forEach(discordGuildMemberResponse => {
    if (discordGuildMemberResponse.status === 'success' && discordGuildMemberResponse.data) {
      discordGuildMembers.push(discordGuildMemberResponse.data);
    }
  });

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

handler.use(requireUser).use(requireSpaceMembership({ adminOnly: true })).post(importRoles);

export default withSessionRoute(handler);
