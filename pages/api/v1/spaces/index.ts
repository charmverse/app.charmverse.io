
import type { Space } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { upsertUserForDiscordId } from 'lib/discord/upsertUserForDiscordId';
import { onError, onNoMatch, requireSuperApiKey, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createWorkspace } from 'lib/spaces/createWorkspace';
import { getAvailableDomainName } from 'lib/spaces/getAvailableDomainName';
import { InvalidInputError } from 'lib/utilities/errors';
import { isValidUrl } from 'lib/utilities/isValidUrl';
import { IDENTITY_TYPES } from 'models';

type CreateSpaceInputData = {
  name: string;
  discordServerId: string;
  adminDiscordUserId: string;
  avatar?: string;
}

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireKeys(['name', 'discordServerId', 'adminDiscordUserId'], 'body'))
  .use(requireSuperApiKey)
  .post(createSpace);

async function createSpace (req: NextApiRequest, res: NextApiResponse<Space>) {
  const { name, discordServerId, avatar, adminDiscordUserId } = req.body as CreateSpaceInputData;

  if (name.length < 3) {
    throw new InvalidInputError('Space name must be at least 3 characters');
  }

  // generate a domain name based on space
  const spaceDomain = await getAvailableDomainName(name);

  // create new bot user as space creator
  const botUser = await prisma.user.create({
    data: {
      username: 'Bot',
      isBot: true,
      identityType: IDENTITY_TYPES[3]
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
        id: botUser.id
      }
    },
    superApiToken: {
      connect: {
        id: req.superApiToken?.id
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

  return res.status(201).json(space);
}

export default withSessionRoute(handler);

