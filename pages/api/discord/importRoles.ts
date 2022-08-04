import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'db';
import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import nc from 'next-connect';
import { withSessionRoute } from 'lib/session/withSession';
import { handleDiscordResponse } from 'lib/discord/handleDiscordResponse';
import { findOrCreateRoles } from 'lib/roles/createRoles';
import { assignRolesFromDiscord, DiscordGuildMember } from 'lib/discord/assignRoles';
import { DiscordServerRole } from 'lib/discord/interface';
import { isTruthy } from 'lib/utilities/types';

const handler = nc({
  onError,
  onNoMatch
});

export interface ImportDiscordRolesPayload {
  spaceId: string,
  guildId: string,
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
      discordConnectedMember => (
        new Promise<DiscordGuildMember | null>((resolve) => {
          handleDiscordResponse<DiscordGuildMember>(
            `https://discord.com/api/v8/guilds/${guildId}/members/${discordConnectedMember.discordUser!.discordId}`
          ).then(resolvedData => {
            if (resolvedData.status === 'success') {
              resolve(resolvedData.data);
            }
            else {
              resolve(null);
            }
          }).catch(() => {
            resolve(null);
          });
        })
      )
    )
  );

  discordGuildMembers.push(...discordGuildMemberResponses.filter(isTruthy));

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
