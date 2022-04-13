import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import * as http from 'adapters/http';
import { prisma } from 'db';
import { NextApiRequest, NextApiResponse } from 'next';
import { withSessionRoute } from 'lib/session/withSession';
import { authenticatedRequest } from 'lib/discord/handleDiscordResponse';
import { findOrCreateRolesFromDiscord, DiscordServerRole } from 'lib/discord/createRoles';
import { assignRolesFromDiscord, DiscordGuildMember } from 'lib/discord/assignRoles';
import { DiscordUser } from '@prisma/client';
import log from 'lib/log';
import { getDiscordAccount } from 'lib/discord/getDiscordAccount';
import { DiscordAccount } from 'lib/discord/loginByDiscord';

const handler = nc({
  onError,
  onNoMatch
});

export interface ConnectDiscordPayload {
  code: string
  spaceId: string
}

export interface ConnectDiscordResponse {
  discordUser: DiscordUser,
  avatar: string | null,
  username: string | null
}

// TODO: Add nonce for oauth state
async function connectDiscord (req: NextApiRequest, res: NextApiResponse<ConnectDiscordResponse | {error: string}>) {
  const { code } = req.body as ConnectDiscordPayload;
  if (!code) {
    res.status(400).json({
      error: 'Missing code to connect'
    });
    return;
  }

  let discordAccount: DiscordAccount;

  try {
    discordAccount = await getDiscordAccount(code, req.headers.host!.startsWith('localhost') ? `http://${req.headers.host}/api/discord/callback` : 'https://app.charmverse.io/api/discord/callback');
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
  catch (error) {
    log.warn('Error while connecting to Discord', error);
    // If the discord user is already connected to a charmverse account this code will be run
    res.status(400).json({
      error: 'Connection to Discord failed. Another CharmVerse account is already associated with this Discord account.'
    });
    return;
  }

  const avatar = discordAccount.avatar ? `https://cdn.discordapp.com/avatars/${discordAccount.id}/${discordAccount.avatar}.png` : undefined;

  const updatedUser = await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      username: discordAccount.username,
      avatar
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
      const rolesRecord = await findOrCreateRolesFromDiscord(discordServerRoles, space.id, req.session.user.id, false);
      const guildMemberResponse = await authenticatedRequest<DiscordGuildMember>(`https://discord.com/api/v8/guilds/${space.discordServerId}/members/${id}`);
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
