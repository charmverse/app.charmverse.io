import type { DiscordUser } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { getUserS3FilePath, uploadUrlToS3 } from 'lib/aws/uploadToS3Server';
import type { DiscordGuildMember } from 'lib/discord/assignRoles';
import { assignRolesFromDiscord } from 'lib/discord/assignRoles';
import type { DiscordAccount } from 'lib/discord/getDiscordAccount';
import { getDiscordAccount } from 'lib/discord/getDiscordAccount';
import { authenticatedRequest } from 'lib/discord/handleDiscordResponse';
import type { DiscordServerRole } from 'lib/discord/interface';
import log from 'lib/log';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { findOrCreateRoles } from 'lib/roles/createRoles';
import { withSessionRoute } from 'lib/session/withSession';
import { mergeUserDiscordAccounts } from 'lib/users/mergeUserDiscordAccounts';
import { IDENTITY_TYPES } from 'models';

const handler = nc({
  onError,
  onNoMatch
});

export interface ConnectDiscordPayload {
  code: string;
}

export interface ConnectDiscordResponse {
  discordUser: DiscordUser;
  avatar: string | null;
  username: string | null;
}

// TODO: Add nonce for oauth state
async function connectDiscord (req: NextApiRequest, res: NextApiResponse<ConnectDiscordResponse | { error: string }>) {
  const { code } = req.body as ConnectDiscordPayload;
  if (!code) {
    res.status(400).json({
      error: 'Missing code to connect'
    });
    return;
  }

  let discordAccount: DiscordAccount;

  try {
    const domain = req.headers.host?.startsWith('localhost') ? `http://${req.headers.host}` : `https://${req.headers.host}`;
    discordAccount = await getDiscordAccount({ code, redirectUrl: `${domain}/api/discord/callback` });
  }
  catch (error) {
    log.warn('Error while connecting to Discord', error);
    res.status(400).json({
      error: 'Invalid token'
    });
    return;
  }

  const { id, ...rest } = discordAccount;
  const userId = req.session.user.id;
  let discordUser: DiscordUser;

  try {
    // discordUser =

    // We check if a user was already created using discord oauth
    const existingDiscordUser = await prisma.discordUser.findFirst({
      where: {
        discordId: id
      }
    });

    // If the entry exists we merge the user accounts
    if (existingDiscordUser) {
      discordUser = await mergeUserDiscordAccounts({
        discordId: existingDiscordUser.discordId,
        currentUserId: userId,
        toDeleteUserId: existingDiscordUser.userId
      });
    }
    else {
      // If not created we create a new entry
      discordUser = await prisma.discordUser.create({
        data: {
          account: rest as any,
          discordId: id,
          user: {
            connect: {
              id: userId
            }
          }
        }
      });
    }

  }
  catch (error) {
    log.warn('Error while creating Discord record', error);
    // If the discord user is already connected to a charmverse account this code will be run
    res.status(400).json({
      error: 'Connection to Discord failed.'
    });
    return;
  }

  const avatarUrl = discordAccount.avatar ? `https://cdn.discordapp.com/avatars/${discordAccount.id}/${discordAccount.avatar}.png` : undefined;
  let avatar: string | null = null;
  if (avatarUrl) {
    try {
      ({ url: avatar } = await uploadUrlToS3({ pathInS3: getUserS3FilePath({ userId, url: avatarUrl }), url: avatarUrl }));
    }
    catch (err) {
      log.warn('Error while uploading avatar to S3', err);
    }
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      username: discordAccount.username,
      avatar,
      identityType: IDENTITY_TYPES[1]
    }
  });

  // Get the discord guild attached with the spaceId
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId: req.session.user.id
    },
    include: {
      space: true
    }
  });

  const spacesWithDiscord = spaceRoles
    .map(role => role.space)
    .filter(space => space.discordServerId);

  // If the workspace is connected with a discord server
  for (const space of spacesWithDiscord) {
    // Get all the roles from the discord server
    try {
      const discordServerRoles = await authenticatedRequest<DiscordServerRole[]>(`https://discord.com/api/v8/guilds/${space.discordServerId}/roles`);
      // Dont create new roles
      const rolesRecord = await findOrCreateRoles(discordServerRoles, space.id, req.session.user.id, { createRoles: false });
      const guildMemberResponse = await authenticatedRequest<DiscordGuildMember>(`https://discord.com/api/v8/guilds/${space.discordServerId}/members/${id}`);
      // Remove the roles imported from guild.xyz
      for (const roleId of Object.keys(rolesRecord)) {
        const role = rolesRecord[roleId];
        if (role?.sourceId && role.source === 'guild_xyz') {
          delete rolesRecord[roleId];
        }
      }
      await assignRolesFromDiscord(rolesRecord, [guildMemberResponse], space.id);
    }
    catch (error) {
      log.warn('Could not add Discord roles to user on connect', error);
    }
  }

  res.status(200).json({
    ...updatedUser,
    discordUser
  });
}

handler.use(requireUser).post(connectDiscord);

export default withSessionRoute(handler);
