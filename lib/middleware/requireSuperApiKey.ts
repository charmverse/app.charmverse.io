import crypto from 'node:crypto';

import type { SuperApiToken } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import { prisma } from 'db';
import { InvalidApiKeyError } from 'lib/middleware/errors';

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

  const superApiToken: SuperApiToken | null = apiKey ? await getVerifiedSuperApiToken(apiKey) : null;

  if (superApiToken) {
    req.superApiToken = superApiToken;
  } else {
    throw new InvalidApiKeyError();
  }

  next();
}

function getVerifiedSuperApiToken(token: string): Promise<SuperApiToken | null> {
  return prisma.superApiToken.findUnique({
    where: {
      token
    }
  });
}

function getAPIKeyFromRequest(req: NextApiRequest): string | null {
  return req.headers?.authorization?.split('Bearer').join('').trim() ?? (req.query.api_key as string);
}

export async function retrieveSuperApiKeySpaceIds(req: NextApiRequest): Promise<string[]> {
  const superApiTokenId = getAPIKeyFromRequest(req);
  if (!superApiTokenId) {
    return [];
  }
  const spaces = await prisma.space.findMany({
    where: {
      superApiTokenId
    }
  });
  return spaces.map((space) => space.id);
}
