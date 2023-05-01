import { InvalidInputError, stringUtils, SubscriptionRequiredError } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import type { ResourceIdEntity } from 'lib/permissions/api/routers';
import { checkSpacePermissionsEngine } from 'lib/permissions/api/routers';

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
    const resourceId = req[location][key];

    if (!stringUtils.isUUID(resourceId)) {
      throw new InvalidInputError(
        `Valid ID for a ${resourceIdType} at request ${location} with key ${key} is required`
      );
    }

    const engine = await checkSpacePermissionsEngine({
      resourceId,
      resourceIdType
    });

    if (engine === 'private') {
      next();
    } else {
      throw new SubscriptionRequiredError();
    }
  };
}
