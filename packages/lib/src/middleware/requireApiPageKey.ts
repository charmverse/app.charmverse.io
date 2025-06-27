import type { ApiPageKey } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError, SubscriptionRequiredError } from '@packages/core/errors';
import { getPermissionsClient } from '@packages/lib/permissions/api';
import { InvalidApiKeyError } from '@packages/nextjs/errors';
import type { NextApiRequest } from 'next';
import type { NextHandler } from 'next-connect';

export type InjectedPageApiKey = ApiPageKey & { page: { spaceId: string } };

export type NextApiRequestWithApiPageKey = NextApiRequest & { apiPageKey: InjectedPageApiKey };

/**
 * Used for databases receiving data from external services.
 */
export async function requireApiPageKey(req: NextApiRequest, res: NextApiRequest, next: NextHandler) {
  const apiPageKey = req.query.apiPageKey as string;

  if (!apiPageKey || typeof apiPageKey !== 'string') {
    throw new InvalidInputError('Api key is required');
  }

  const apiPageKeyInDb = (await prisma.apiPageKey.findUnique({
    where: { apiKey: apiPageKey },
    include: { page: { select: { spaceId: true } } }
  })) as InjectedPageApiKey | null;

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

  (req as NextApiRequestWithApiPageKey).apiPageKey = apiPageKeyInDb;

  next();
}
