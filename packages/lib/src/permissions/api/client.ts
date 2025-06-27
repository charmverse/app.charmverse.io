import type {
  GetPermissionClient,
  PermissionsClient,
  PermissionsEngine,
  PremiumPermissionsClient
} from '@packages/core/permissions';
import { getSpaceInfoViaResource } from '@packages/core/permissions';

import { PublicPermissionsClient } from './freeClient';
import { PermissionsApiClientWithPermissionsSwitch } from './overridenPermissionsApiClient';

export const publicClient = new PublicPermissionsClient();
export const permissionsApiClient = new PermissionsApiClientWithPermissionsSwitch();

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
  const spaceInfo = await getSpaceInfoViaResource({
    resourceId,
    resourceIdType
  });

  if (spaceInfo.tier !== 'free') {
    return { type: spaceInfo.permissionType, client: permissionsApiClient, spaceId: spaceInfo.spaceId };
  } else {
    return { type: spaceInfo.permissionType, client: publicClient, spaceId: spaceInfo.spaceId };
  }
}
