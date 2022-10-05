import crypto from 'node:crypto';

import type { Space, SpaceApiToken, User } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import { prisma } from 'db';
import log from 'lib/log';
import { ApiError } from 'lib/middleware/errors';
import { IDENTITY_TYPES } from 'models';

declare module 'http' {
  interface IncomingMessage {
    authorizedSpaceId: string;
    botUser: User;
  }
}

export async function provisionApiKey (spaceId: string): Promise<SpaceApiToken> {
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
export async function getBotUser (spaceId: string): Promise<User> {
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
        identityType: IDENTITY_TYPES[3]
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
export async function getSpaceFromApiKey (req: NextApiRequest): Promise<Space> {
  const apiKey = req.headers?.authorization?.split('Bearer').join('').trim() ?? req.query.api_key as string;

  // Protect against api keys or nullish API Keys
  if (!apiKey || apiKey.length < 1) {
    throw new ApiError({
      message: 'API Key not found',
      errorType: 'Access denied'
    });
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
    throw new ApiError({
      message: 'Invalid API key',
      errorType: 'Access denied'
    });
  }

  return spaceToken.space;
}

/**
 * Check for a valid space level API token, and ensure the operation is taking place only in the target space
 *
 * assigns authorizedSpaceId so follow-on endpoints can use it
 */
export async function requireApiKey (req: NextApiRequest, res: NextApiResponse, next: NextHandler) {

  try {
    const space = await getSpaceFromApiKey(req);

    const querySpaceId = req.query.spaceId;

    if (querySpaceId && querySpaceId !== space.id) {
      throw new ApiError({
        message: 'API Token does not have access to this space',
        errorType: 'Access denied'
      });
    }

    const bodySpaceId = req.body.spaceId;

    if (bodySpaceId && bodySpaceId !== space.id) {
      throw new ApiError({
        message: 'API Token does not have access to this space',
        errorType: 'Access denied'
      });
    }

    req.authorizedSpaceId = space.id;

    const botUser = await getBotUser(space.id);

    req.botUser = botUser;

  }
  catch (error) {
    log.warn('Found error', error);
    throw new ApiError({
      message: 'Please provide a valid API token',
      errorType: 'Access denied'
    });
  }

  next();

}

export default requireApiKey;
