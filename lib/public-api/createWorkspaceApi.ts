import type { SuperApiToken } from '@prisma/client';

import { baseUrl } from 'config/constants';
import { prisma } from 'db';
import { upsertUserForDiscordId } from 'lib/discord/upsertUserForDiscordId';
import { createWorkspace } from 'lib/spaces/createWorkspace';
import { getAvailableDomainName } from 'lib/spaces/getAvailableDomainName';
import { createUserFromWallet } from 'lib/users/createUser';
import { isValidUrl } from 'lib/utilities/isValidUrl';

import type { CreateWorkspaceRequestBody, CreateWorkspaceResponseBody } from './interfaces';

export async function createWorkspaceApi({
  name,
  discordServerId,
  adminDiscordUserId,
  adminWalletAddress,
  avatar,
  superApiToken
}: CreateWorkspaceRequestBody & { superApiToken?: SuperApiToken | null }): Promise<CreateWorkspaceResponseBody> {
  // generate a domain name based on space
  const spaceDomain = await getAvailableDomainName(name);

  // create new bot user as space creator
  const botUser = await prisma.user.create({
    data: {
      username: 'Bot',
      isBot: true,
      identityType: 'RandomName'
    }
  });
  const adminUserId = adminDiscordUserId
    ? await upsertUserForDiscordId(adminDiscordUserId)
    : await createUserFromWallet({ address: adminWalletAddress }).then((user) => user.id);

  if (!adminUserId) {
    throw new Error('No admin user ID created. TODO: Implement support for wallet address');
  }

  // Create workspace
  const spaceData = {
    name,
    updatedBy: botUser.id,
    domain: spaceDomain,
    spaceImage: avatar && isValidUrl(avatar) ? avatar : undefined,
    discordServerId,
    author: {
      connect: {
        id: adminUserId
      }
    },
    superApiToken: {
      connect: {
        id: superApiToken?.id
      }
    },
    spaceRoles: {
      create: [
        // add bot user to space
        {
          isAdmin: true,
          user: {
            connect: {
              id: botUser.id
            }
          }
        },
        // add discord admin user to space
        {
          isAdmin: true,
          user: {
            connect: {
              id: adminUserId
            }
          }
        }
      ]
    }
  };

  const space = await createWorkspace({ spaceData, userId: botUser.id });

  return {
    id: space.id,
    spaceUrl: `${baseUrl}/${space.domain}`,
    joinUrl: `${baseUrl}/join?domain=${space.domain}`
  };
}
