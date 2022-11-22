
import type { Space } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireSuperApiKey } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createWorkspace } from 'lib/spaces/createWorkspace';
import { getAvailableDomainName } from 'lib/spaces/getAvailableDomainName';
import { getSpaceByDomain } from 'lib/spaces/getSpaceByDomain';
import { validateDomainName } from 'lib/spaces/validateDomainName';
import { DataConflictError, InvalidInputError } from 'lib/utilities/errors';
import { isValidUrl } from 'lib/utilities/isValidUrl';
import { IDENTITY_TYPES } from 'models';

type CreateSpaceInputData = {
  name: string;
  discordServerId: string;
  domain?: string;
  avatar?: string;
}

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSuperApiKey)
  // .get(getSpaces)
  .post(createSpace);

// async function getSpaces (req: NextApiRequest, res: NextApiResponse<Space[]>) {
//   const userId = req.session.user.id;

//   const spaceRoles = await prisma.spaceRole.findMany({
//     where: {
//       userId
//     },
//     include: {
//       space: true
//     }
//   });
//   const spaces = spaceRoles.map(sr => sr.space);
//   return res.status(200).json(spaces);
// }

async function createSpace (req: NextApiRequest, res: NextApiResponse<Space>) {
  const { name, discordServerId, domain, avatar } = req.body as CreateSpaceInputData;

  if (!name) {
    throw new InvalidInputError('Missing space name');
  }

  if (name.length < 3) {
    throw new InvalidInputError('Space name must be at least 3 characters');
  }

  if (!discordServerId) {
    throw new InvalidInputError('Missing discord server id');
  }

  let spaceDomain = domain;

  if (spaceDomain) {
    // Validate domain name if user provided one
    const { isValid, error } = validateDomainName(spaceDomain);
    if (!isValid) {
      throw new InvalidInputError(error);
    }

    const existingSpace = await getSpaceByDomain(spaceDomain);
    if (existingSpace) {
      throw new DataConflictError('Domain name is already taken');
    }
  }
  else {
    // generate a domain name if user didn't provide one
    spaceDomain = await getAvailableDomainName(name);
  }

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
  await prisma.spaceRole.create({
    data: {
      spaceId: space.id,
      userId: botUser.id,
      isAdmin: true
    }
  });

  return res.status(201).json(space);
}

export default withSessionRoute(handler);

