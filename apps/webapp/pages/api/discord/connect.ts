import type { DiscordUser } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import { assignRolesFromDiscord } from '@packages/lib/discord/assignRoles';
import type { DiscordAccount } from '@packages/lib/discord/client/getDiscordAccount';
import { getDiscordAccount } from '@packages/lib/discord/client/getDiscordAccount';
import { getGuildMember } from '@packages/lib/discord/client/getGuildMember';
import { getGuildRoles } from '@packages/lib/discord/client/getGuildRoles';
import { getDiscordCallbackUrl } from '@packages/lib/discord/getDiscordCallbackUrl';
import { checkUserSpaceBanStatus } from '@packages/lib/members/checkUserSpaceBanStatus';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import type { OauthFlowType } from '@packages/lib/oauth/interfaces';
import { findOrCreateRoles } from '@packages/lib/roles/createRoles';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { mergeUserDiscordAccounts } from '@packages/users/mergeUserDiscordAccounts';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { updateUserDiscordSocial } from 'pages/api/discord/updateUserDiscordSocial';

const handler = nc({
  onError,
  onNoMatch
});

export interface ConnectDiscordPayload {
  code: string;
}

export interface ConnectDiscordResponse {
  discordUser: DiscordUser;
}

// TODO: Add nonce for oauth state
async function connectDiscord(req: NextApiRequest, res: NextApiResponse<ConnectDiscordResponse | { error: string }>) {
  const { code } = req.body as ConnectDiscordPayload;
  const authFlowType = req.query.authFlowType as OauthFlowType | undefined;

  if (!code) {
    res.status(400).json({
      error: 'Missing code to connect'
    });
    return;
  }

  let discordAccount: DiscordAccount;

  try {
    discordAccount = await getDiscordAccount({
      code,
      redirectUrl: getDiscordCallbackUrl(req.headers.host, authFlowType)
    });
  } catch (error) {
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

    const spaceRoles = await prisma.spaceRole.findMany({
      where: {
        userId
      },
      select: {
        space: {
          select: {
            id: true
          }
        }
      }
    });

    const userSpaceIds = spaceRoles.map((role) => role.space.id);

    const isUserBannedFromSpace = await checkUserSpaceBanStatus({
      spaceIds: userSpaceIds,
      discordId: existingDiscordUser?.discordId ?? id
    });

    if (isUserBannedFromSpace) {
      return res.status(401).json({
        error: 'You need to leave space before you can add this discord identity to your account'
      });
    }

    // If the entry exists we merge the user accounts
    if (existingDiscordUser) {
      discordUser = await mergeUserDiscordAccounts({
        discordId: existingDiscordUser.discordId,
        currentUserId: userId,
        toDeleteUserId: existingDiscordUser.userId
      });
    } else {
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
  } catch (error) {
    log.warn('Error while creating Discord record', {
      error
    });
    // If the discord user is already connected to a charmverse account this code will be run
    res.status(400).json({
      error: 'Connection to Discord failed.'
    });
    return;
  }

  // Get the discord guild attached with the spaceId
  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId: req.session.user.id
    },
    include: {
      space: true
    }
  });

  const spacesWithDiscord = spaceRoles.map((role) => role.space).filter((space) => space.discordServerId);
  await updateUserDiscordSocial({ userId, discordUsername: discordAccount.username });

  // If the workspace is connected with a discord server
  for (const space of spacesWithDiscord) {
    // Get all the roles from the discord server
    try {
      if (space.discordServerId) {
        const discordServerRoles = await getGuildRoles(space.discordServerId);
        // Dont create new roles
        const rolesRecord = await findOrCreateRoles(discordServerRoles, space.id, req.session.user.id, {
          createRoles: false
        });
        const guildMemberResponse = await getGuildMember({ guildId: space.discordServerId, memberId: id });
        // Remove the roles imported from guild.xyz
        for (const roleId of Object.keys(rolesRecord)) {
          const role = rolesRecord[roleId];
          if (role?.sourceId && role.source === 'guild_xyz') {
            delete rolesRecord[roleId];
          }
        }
        await assignRolesFromDiscord(rolesRecord, [guildMemberResponse], space.id);
      }
    } catch (error) {
      log.warn('Could not add Discord roles to user on connect', error);
    }
  }

  res.status(200).json({ discordUser });
}

handler.use(requireUser).post(connectDiscord);

export default withSessionRoute(handler);
