import crypto from 'node:crypto';

import { prisma } from '@charmverse/core';
import type { SuperApiToken } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import { InvalidApiKeyError } from 'lib/middleware/errors';
import './requireApiKey'; // import types on http

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
  const apiKey = getAPIKeyFromRequest(req);

  let superApiToken: SuperApiToken | null = null;
  if (apiKey) {
    const apiTokenData = await getVerifiedSuperApiToken(apiKey);

    superApiToken = apiTokenData?.superApiKey || null;

    if (apiTokenData) {
      req.authorizedSpaceId = apiTokenData.authorizedSpace?.id || '';
      req.spaceIdRange = apiTokenData.spaceIdRange;
    }
  }

  if (superApiToken) {
    req.superApiToken = superApiToken;
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
