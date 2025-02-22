import crypto from 'node:crypto';

import type { SuperApiToken } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidApiKeyError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

declare module 'http' {
  interface IncomingMessage {
    superApiToken: SuperApiToken | null;
  }
}

export async function provisionSuperApiKey(name: string, token?: string): Promise<SuperApiToken> {
  token ||= crypto.randomBytes(160 / 8).toString('hex');
  const superToken = await prisma.superApiToken.create({
    data: {
      token,
      name
    }
  });

  return superToken;
}

/**
 * Check for a valid SUPER API token
 *
 * assigns superApiToken so follow-on endpoints can use it
 */
export async function requireSuperApiKey(req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  const detectedApiKey = getAPIKeyFromRequest(req);

  const superApiTokenData = detectedApiKey
    ? await getVerifiedSuperApiToken(detectedApiKey, req.query?.spaceId as string)
    : null;
  if (superApiTokenData) {
    req.superApiToken = superApiTokenData.superApiKey;
    req.spaceIdRange = superApiTokenData.spaceIdRange;
    req.authorizedSpaceId = superApiTokenData.authorizedSpace?.id || '';
  } else {
    throw new InvalidApiKeyError();
  }

  next();
}

export async function getVerifiedSuperApiToken(token: string, spaceId?: string) {
  const superApiKey = await prisma.superApiToken.findUnique({
    where: {
      token
    },
    include: {
      spaces: true
    }
  });

  if (superApiKey) {
    const spaceIdRange = superApiKey.spaces.map((space) => space.id);
    const authorizedSpace = spaceId ? superApiKey.spaces.find((space) => space.id === spaceId) : null;

    if (spaceId && !authorizedSpace) {
      return null;
    }

    return {
      superApiKey,
      spaceIdRange,
      authorizedSpace
    };
  }
}

function getAPIKeyFromRequest(req: NextApiRequest): string | null {
  return req.headers?.authorization?.split('Bearer').join('').trim() ?? (req.query.api_key as string);
}
