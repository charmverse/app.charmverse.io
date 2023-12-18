import type {
  GetPermissionClient,
  PermissionsClient,
  PermissionsEngine,
  PremiumPermissionsClient
} from '@charmverse/core/permissions';
import { PermissionsApiClient, getSpacePermissionsType } from '@charmverse/core/permissions';

import { permissionsApiAuthKey, permissionsApiUrl } from 'config/constants';

import { PublicPermissionsClient } from './client';

export const publicClient = new PublicPermissionsClient();
export const permissionsApiClient = new PermissionsApiClient({
  authKey: permissionsApiAuthKey,
  baseUrl: permissionsApiUrl
});
export type SpacePermissionsClient = {
  type: PermissionsEngine;
  client: PermissionsClient | PremiumPermissionsClient;
  spaceId: string;
};

/**
 * Get correct permissions client for a specific space, return premium client if space is paid subscriber
 * */
export async function getPermissionsClient({
  resourceId,
  resourceIdType = 'space'
}: GetPermissionClient): Promise<SpacePermissionsClient> {
  const spaceInfo = await getSpacePermissionsType({
    resourceId,
    resourceIdType
  });

  if (spaceInfo.tier !== 'free') {
    return { type: spaceInfo.permissionType, client: permissionsApiClient, spaceId: spaceInfo.spaceId };
  } else {
    return { type: spaceInfo.permissionType, client: publicClient, spaceId: spaceInfo.spaceId };
  }
}
