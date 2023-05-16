import { SubscriptionRequiredError } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import type { ResourceIdEntity } from 'lib/permissions/api/routers';

/**
 * Build that generates a middleware that can resolve if the space has paid feature access based on a resource Id value and where to find that value
 */
type MiddlewareConfig = {
  resourceIdType: ResourceIdEntity;
  key: string;
  location: 'body' | 'query';
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
