import type { PermissionsClient, PremiumPermissionsClient } from '@charmverse/core';
import { InvalidInputError, stringUtils } from '@charmverse/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import { getPermissionsClient } from './routers';
import type { PermissionsEngine, ResourceIdEntity } from './routers';

declare module 'http' {
  interface IncomingMessage {
    basePermissionsClient: PermissionsClient;
    premiumPermissionsClient: PremiumPermissionsClient;
    spacePermissionsEngine: PermissionsEngine;
  }
}
/**
 * Build that generates a middleware that can resolve if the space has paid feature access based on a resource Id value and where to find that value
 */
type MiddlewareConfig = {
  resourceIdType: ResourceIdEntity;
  key: string;
  location: 'body' | 'query';
};

/**
 * Determine if the space linked to a resource should use public or private permissions
 * Provides basePermissionsClient and spacePermissionsEngine to the request.
 * Also provides premiumPermissionsClient if the space is paid space.
 */
export function providePermissionClients({ key, location, resourceIdType }: MiddlewareConfig) {
  // eslint-disable-next-line func-names
  return async function (req: NextApiRequest, res: NextApiResponse, next?: NextHandler) {
    const resourceId = req[location][key];

    if (!stringUtils.isUUID(resourceId)) {
      throw new InvalidInputError(
        `Valid ID for a ${resourceIdType} at request ${location} with key ${key} is required`
      );
    }

    const clientWithInfo = await getPermissionsClient({
      resourceId,
      resourceIdType
    });

    req.basePermissionsClient = clientWithInfo.client;

    if (clientWithInfo.type === 'premium') {
      req.premiumPermissionsClient = clientWithInfo.client as PremiumPermissionsClient;
    }

    req.spacePermissionsEngine = clientWithInfo.type;

    // Allows using this as a middleware, or inside another middleware which should not pass the next function
    next?.();
  };
}
