import { InvalidInputError } from '@packages/core/errors';
import type {
  PermissionsClient,
  PermissionsEngine,
  PremiumPermissionsClient,
  ResourceIdEntity
} from '@packages/core/permissions';
import { stringUtils } from '@packages/core/utilities';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import { getPermissionsClient, permissionsApiClient } from './client';

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
  location?: 'body' | 'query';
};

/**
 * Determine if the space linked to a resource should use public or private permissions
 * Provides basePermissionsClient and spacePermissionsEngine to the request.
 * Also provides premiumPermissionsClient if the space is paid space.
 */
export function providePermissionClients({ key, location, resourceIdType }: MiddlewareConfig) {
  // eslint-disable-next-line func-names
  return async function (req: NextApiRequest, res: NextApiResponse, next?: NextHandler) {
    const resourceId = location ? req[location][key] : req.body[key] || req.query[key];

    if (!stringUtils.isUUID(resourceId)) {
      throw new InvalidInputError(
        `Valid ID for a ${resourceIdType} at request ${location || ''} with key ${key} is required`
      );
    }

    const clientWithInfo = await getPermissionsClient({
      resourceId,
      resourceIdType
    });

    // Provide different base client based on space paid tier
    req.basePermissionsClient = clientWithInfo.client;
    // Always provide premium client
    req.premiumPermissionsClient = permissionsApiClient;

    req.spacePermissionsEngine = clientWithInfo.type;

    req.authorizedSpaceId = clientWithInfo.spaceId;

    // Allows using this as a middleware, or inside another middleware which should not pass the next function
    next?.();
  };
}
