import crypto from 'node:crypto';

import type { Space, SuperApiToken, User } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import { prisma } from 'db';
import log from 'lib/log';
import { ApiError } from 'lib/middleware/errors';
import { IDENTITY_TYPES } from 'models';

export async function provisionSuperApiKey (name: string): Promise<SuperApiToken> {
  const newApiKey = crypto.randomBytes(160 / 8).toString('hex');

  const superToken = await prisma.superApiToken.create({
    data: {
      token: newApiKey,
      name
    }
  });

  return superToken;
}

/**
 * Check for a valid space level API token, and ensure the operation is taking place only in the target space
 *
 * assigns authorizedSpaceId so follow-on endpoints can use it
 */
export async function requireSuperApiKey (req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  const apiKey = req.headers?.authorization?.split('Bearer').join('').trim() ?? req.query.api_key as string;

  let superApiToken: SuperApiToken | null = null;

  try {
    if (apiKey) {
      superApiToken = await getVerifiedSuperApiToken(apiKey);
    }
  }
  catch (error) {
    superApiToken = null;
  }

  if (superApiToken) {
    req.superApiToken = superApiToken;
  }
  else {
    throw new ApiError({
      message: 'Invalid API key',
      errorType: 'Access denied'
    });
  }

  next();
}

export function getVerifiedSuperApiToken (token: string): Promise<SuperApiToken | null> {
  return prisma.superApiToken.findFirst({
    where: {
      token
    }
  });
}
