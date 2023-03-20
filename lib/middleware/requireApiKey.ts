import crypto from 'node:crypto';

import type { Space, SpaceApiToken, User } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import { prisma } from 'db';
import log from 'lib/log';
import { ApiError, InvalidApiKeyError } from 'lib/middleware/errors';
import { getVerifiedSuperApiToken } from 'lib/middleware/requireSuperApiKey';

declare module 'http' {
  /**
   * @authorizedSpaceid - Space ID that the API key is making a request for and authorized to use
   * @spaceIdRange - Range of spaceIDs that a super API key can use
   */
  interface IncomingMessage {
    authorizedSpaceId: string;
    // When using
    spaceIdRange?: string[];
    botUser: User;
  }
}

export async function provisionApiKey(spaceId: string): Promise<SpaceApiToken> {
  const newApiKey = crypto.randomBytes(160 / 8).toString('hex');

  const spaceToken = await prisma.spaceApiToken.upsert({
    where: {
      spaceId: spaceId as string
    },
    update: {
      token: newApiKey,
      updatedAt: new Date().toISOString()
    },
    create: {
      token: newApiKey,
      space: {
        connect: {
          id: spaceId
        }
      }
    }
  });

  await getBotUser(spaceId);

  return spaceToken;
}

/**
 * Returns bot user for the space, and creates one if they do not exist
 */
export async function getBotUser(spaceId: string): Promise<User> {
  let botUser = await prisma.user.findFirst({
    where: {
      isBot: true,
      spaceRoles: {
        some: {
          spaceId
        }
      }
    }
  });

  if (!botUser) {
    botUser = await prisma.user.create({
      data: {
        username: 'Bot',
        isBot: true,
        identityType: 'RandomName'
      }
    });

    await prisma.spaceRole.create({
      data: {
        spaceId,
        userId: botUser.id,
        isAdmin: true
      }
    });
  }

  return botUser;
}

/**
 * @returns Space linked to API key in the request
 * Throws if the API key or space do not exist
 */
export async function setRequestSpaceFromApiKey(req: NextApiRequest): Promise<Space> {
  const apiKey = req.headers?.authorization?.split('Bearer').join('').trim() ?? (req.query.api_key as string);

  // Protect against api keys or nullish API Keys
  if (!apiKey || apiKey.length < 1) {
    throw new InvalidApiKeyError();
  }
  const superApiKeyData = await getVerifiedSuperApiToken(apiKey, req.query?.spaceId as string);

  if (superApiKeyData) {
    // super api key without spaceId param
    if (!superApiKeyData.authorizedSpace) {
      throw new InvalidApiKeyError();
    }

    req.authorizedSpaceId = superApiKeyData.authorizedSpace.id;
    req.spaceIdRange = superApiKeyData.spaceIdRange;
    req.superApiToken = superApiKeyData.superApiKey;

    return superApiKeyData.authorizedSpace;
  }

  const spaceToken = await prisma.spaceApiToken.findFirst({
    where: {
      token: apiKey
    },
    include: {
      space: true
    }
  });

  if (!spaceToken) {
    throw new InvalidApiKeyError();
  }

  req.authorizedSpaceId = spaceToken.spaceId;
  return spaceToken.space;
}

/**
 * Check for a valid space level API token, and ensure the operation is taking place only in the target space
 *
 * assigns authorizedSpaceId so follow-on endpoints can use it
 */
export async function requireApiKey(req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  try {
    await setRequestSpaceFromApiKey(req);

    const querySpaceId = req.query?.spaceId;

    if (querySpaceId && querySpaceId !== req.authorizedSpaceId) {
      throw new ApiError({
        message: 'API Token does not have access to this space',
        errorType: 'Access denied'
      });
    }

    const bodySpaceId = req.body?.spaceId;

    if (bodySpaceId && bodySpaceId !== req.authorizedSpaceId) {
      throw new ApiError({
        message: 'API Token does not have access to this space',
        errorType: 'Access denied'
      });
    }

    const botUser = await getBotUser(req.authorizedSpaceId);

    req.botUser = botUser;
  } catch (error) {
    log.warn('Found error', error);
    throw new InvalidApiKeyError();
  }

  next();
}

export default requireApiKey;
