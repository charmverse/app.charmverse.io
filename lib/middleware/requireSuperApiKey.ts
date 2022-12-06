import crypto from 'node:crypto';

import type { SuperApiToken } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import { prisma } from 'db';
import { ApiError } from 'lib/middleware/errors';

declare module 'http' {
  interface IncomingMessage {
    superApiToken: SuperApiToken | null;
  }
}

export async function provisionSuperApiKey(name: string): Promise<SuperApiToken> {
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
 * Check for a valid SUPER API token
 *
 * assigns superApiToken so follow-on endpoints can use it
 */
export async function requireSuperApiKey(req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  const apiKey = req.headers?.authorization?.split('Bearer').join('').trim() ?? (req.query.api_key as string);

  const superApiToken: SuperApiToken | null = apiKey ? await getVerifiedSuperApiToken(apiKey) : null;

  if (superApiToken) {
    req.superApiToken = superApiToken;
  } else {
    throw new ApiError({
      message: 'Invalid API key',
      errorType: 'Access denied'
    });
  }

  next();
}

export function getVerifiedSuperApiToken(token: string): Promise<SuperApiToken | null> {
  return prisma.superApiToken.findFirst({
    where: {
      token
    }
  });
}
