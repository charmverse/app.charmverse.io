import type { SuperApiToken } from '@prisma/client';

import { baseUrl } from 'config/constants';
import { prisma } from 'db';
import { upsertSpaceRolesFromDiscord } from 'lib/discord/upsertSpaceRolesFromDiscord';
import { upsertUserForDiscordId } from 'lib/discord/upsertUserForDiscordId';
import { upsertUserRolesFromDiscord } from 'lib/discord/upsertUserRolesFromDiscord';
import type { SpaceCreateInput } from 'lib/spaces/createWorkspace';
import { createWorkspace } from 'lib/spaces/createWorkspace';
import { getAvailableDomainName } from 'lib/spaces/getAvailableDomainName';
import { createUserFromWallet } from 'lib/users/createUser';
import { InvalidInputError } from 'lib/utilities/errors';
import { isValidUrl } from 'lib/utilities/isValidUrl';

import type { CreateWorkspaceRequestBody, CreateWorkspaceResponseBody } from './interfaces';

export async function createWorkspaceApi({
  name,
  discordServerId,
  adminDiscordUserId,
  adminWalletAddress,
  adminUsername,
  adminAvatar,
  xpsEngineId,
  avatar,
  superApiToken,
  webhookUrl
}: CreateWorkspaceRequestBody & { superApiToken?: SuperApiToken | null }): Promise<CreateWorkspaceResponseBody> {
  // Retrieve an id for the admin user
  const adminUserId = adminDiscordUserId
    ? await upsertUserForDiscordId({ discordId: adminDiscordUserId, username: adminUsername, avatar: adminAvatar })
    : await createUserFromWallet({ address: adminWalletAddress, avatar: adminAvatar }).then((user) => user.id);

  if (!adminUserId) {
    throw new InvalidInputError('No admin user ID created.');
  }

  // create new bot user as space creator
  const botUser = await prisma.user.create({
    data: {
      username: 'Bot',
      isBot: true,
      identityType: 'RandomName'
    }
  });

  // generate a domain name based on space
  const spaceDomain = await getAvailableDomainName(name);

  // Create workspace
  const spaceData: SpaceCreateInput = {
    name,
    updatedBy: botUser.id,
    domain: spaceDomain,
    spaceImage: avatar && isValidUrl(avatar) ? avatar : undefined,
    discordServerId,
    xpsEngineId,
    superApiTokenId: superApiToken?.id
  };

  const space = await createWorkspace({ spaceData, userId: adminUserId, webhookUrl, extraAdmins: [botUser.id] });

  // create roles from discord
  if (discordServerId) {
    await upsertSpaceRolesFromDiscord({ space, userId: botUser.id });
  }

  // assing roles to discord admin user
  if (adminDiscordUserId) {
    await upsertUserRolesFromDiscord({ space, userId: adminUserId });
  }

  return {
    id: space.id,
    webhookSigningSecret: space.webhookSigningSecret ?? undefined,
    spaceUrl: `${baseUrl}/${space.domain}`,
    joinUrl: `${baseUrl}/join?domain=${space.domain}`
  };
}
