import { InvalidInputError, SubscriptionRequiredError, UnauthorisedActionError } from '@charmverse/core/errors';
import type { ApiPageKey } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest } from 'next';
import type { NextHandler } from 'next-connect';

import { getPermissionsClient } from 'lib/permissions/api';

import { InvalidApiKeyError } from './errors';

declare module 'http' {
  /**
   * @authorizedSpaceid - Space ID that the API key is making a request for and authorized to use
   * @spaceIdRange - Range of spaceIDs that a super API key can use
   */
  interface IncomingMessage {
    apiPageKey: ApiPageKey & { page: { spaceId: string } };
  }
}

/**
 * Used for databases receiving data from external services.
 */
export async function requireApiPageKey(req: NextApiRequest, res: NextApiRequest, next: NextHandler) {
  const apiPageKey = req.query.apiPageKey as string;

  if (!apiPageKey || typeof apiPageKey !== 'string') {
    throw new InvalidInputError('Api key is required');
  }

  const apiPageKeyInDb = await prisma.apiPageKey.findUnique({
    where: { apiKey: apiPageKey },
    include: { page: { select: { spaceId: true } } }
  });

  if (!apiPageKeyInDb) {
    throw new InvalidApiKeyError();
  }

  const permissionClient = await getPermissionsClient({
    resourceId: apiPageKeyInDb.page.spaceId,
    resourceIdType: 'space'
  });

  if (permissionClient.type === 'free') {
    throw new SubscriptionRequiredError();
  }

  req.apiPageKey = apiPageKeyInDb;

  next();
}
