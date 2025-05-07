import crypto from 'node:crypto';

import { SubscriptionRequiredError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Space, SpaceApiToken, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { ApiError, InvalidApiKeyError } from '@packages/nextjs/errors';
import { uid } from '@packages/utils/strings';
import { getVerifiedSuperApiToken } from '@packages/lib/middleware/requireSuperApiKey';
import { getPermissionsClient } from '@packages/lib/permissions/api';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

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
        identityType: 'RandomName',
        path: uid()
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

type APIKeyType = 'space' | 'partner';

type SpaceWithKey = {
  space: Space;
  apiKey: { type: APIKeyType; key: string };
};

/**
 * @returns Space linked to API key in the request
 * Throws if the API key or space do not exist
 */
export async function setRequestSpaceFromApiKey(req: NextApiRequest): Promise<SpaceWithKey> {
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

    return {
      space: superApiKeyData.authorizedSpace,
      apiKey: { key: superApiKeyData.superApiKey.token, type: 'partner' }
    } as SpaceWithKey;
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
  return { space: spaceToken.space, apiKey: { key: spaceToken.token, type: 'space' } } as SpaceWithKey;
}

/**
 * Check for a valid space level API token, and ensure the operation is taking place only in the target space
 *
 * assigns authorizedSpaceId so follow-on endpoints can use it
 */
export async function requireApiKey(req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  try {
    const apiKeyCheck = await setRequestSpaceFromApiKey(req);
    if (apiKeyCheck.apiKey.type === 'space') {
      const client = await getPermissionsClient({ resourceId: req.authorizedSpaceId, resourceIdType: 'space' });

      if (client.type === 'free') {
        throw new SubscriptionRequiredError();
      }
    }

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
    if (error instanceof SubscriptionRequiredError) {
      throw error;
    }

    log.warn('Found error', error);
    throw new InvalidApiKeyError();
  }

  next();
}

export default requireApiKey;
