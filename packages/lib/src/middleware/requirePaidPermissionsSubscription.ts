import { SubscriptionRequiredError } from '@charmverse/core/errors';
import type { ResourceIdEntity } from '@charmverse/core/permissions';
import { providePermissionClients } from '@packages/lib/permissions/api/permissionsClientMiddleware';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

/**
 * Build that generates a middleware that can resolve if the space has paid feature access based on a resource Id value and where to find that value
 */
type MiddlewareConfig = {
  resourceIdType: ResourceIdEntity;
  key: string;
  location?: 'body' | 'query';
};

export function requirePaidPermissionsSubscription({ key, location, resourceIdType }: MiddlewareConfig) {
  // eslint-disable-next-line func-names
  return async function (req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
    await providePermissionClients({
      key,
      location,
      resourceIdType
    })(req, res);

    if (req.spacePermissionsEngine === 'free') {
      throw new SubscriptionRequiredError();
    }

    next();
  };
}
