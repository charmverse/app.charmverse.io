
import type { Space } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { grantRoleToSpaceDiscordAdmin } from 'lib/discord/discordSpaceAdmin';
import { onError, onNoMatch, requireSuperApiKey } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { addUserToSpace } from 'lib/spaces/addUserToSpace';
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
  .use(requireSuperApiKey)
  .post(createSpace);

async function createSpace (req: NextApiRequest, res: NextApiResponse<Space>) {
  const { name, discordServerId, avatar, adminDiscordUserId } = req.body as CreateSpaceInputData;

  if (!name) {
    throw new InvalidInputError('Missing space name');
  }

  if (name.length < 3) {
    throw new InvalidInputError('Space name must be at least 3 characters');
  }

  if (!discordServerId) {
    throw new InvalidInputError('Missing discord server id');
  }

  if (!adminDiscordUserId) {
    throw new InvalidInputError('Missing discord admin id');
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

  // Create workspace
  const spaceData = {
    name,
    updatedBy: botUser.id,
    domain: spaceDomain,
    spaceImage: avatar && isValidUrl(avatar) ? avatar : undefined,
    adminDiscordUserId,
    author: {
      connect: {
        id: botUser.id
      }
    },
    superApiToken: {
      connect: {
        id: req.superApiToken?.id
      }
    }
  };

  const space = await createWorkspace({ spaceData, userId: botUser.id });

  // Add bot user to space
  await addUserToSpace({
    spaceRole: {
      space: {
        connect: { id: space.id }
      },
      user: {
        connect: { id: botUser.id } },
      isAdmin: true
    }
  });

  // If discord admin user has an account, add him to space as admin
  grantRoleToSpaceDiscordAdmin(space);

  return res.status(201).json(space);
}

export default withSessionRoute(handler);

