import type { SuperApiToken } from '@prisma/client';

import { baseUrl } from 'config/constants';
import { prisma } from 'db';
import { upsertUserForDiscordId } from 'lib/discord/upsertUserForDiscordId';
import { createWorkspace } from 'lib/spaces/createWorkspace';
import { getAvailableDomainName } from 'lib/spaces/getAvailableDomainName';
import { isValidUrl } from 'lib/utilities/isValidUrl';

export type CreatedSpaceResponse = {
  id: string;
  spaceUrl: string;
  joinUrl: string;
};

export type CreateSpaceApiInputData = {
  name: string;
  discordServerId: string;
  adminDiscordUserId: string;
  avatar?: string;
};

export async function createWorkspaceApi({
  name,
  discordServerId,
  adminDiscordUserId,
  avatar,
  superApiToken
}: CreateSpaceApiInputData & { superApiToken?: SuperApiToken | null }): Promise<CreatedSpaceResponse> {
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
  const adminUserId = await upsertUserForDiscordId(adminDiscordUserId);

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
