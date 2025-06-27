import type { PermissionCompute, PublicBountyToggle, SpaceDefaultPublicPageToggle } from '@packages/core/permissions';
import { getSpaceInfoViaResource } from '@packages/core/permissions';
import { stringUtils } from '@packages/core/utilities';

import { SpacePermissionsClient } from '../lib/spacePermissions/client';
import { computeSpacePermissionsForFreeSpace } from '../lib/spacePermissions/freeVersion/computeSpacePermissionsForFreeSpace';

const client = new SpacePermissionsClient();

// Base routes ---------------------
export async function computeSpacePermissions(input: PermissionCompute) {
  const spaceInfo = await getSpaceInfoViaResource({
    resourceId: input.resourceId,
    resourceIdType: 'space'
  });

  const result = await (
    spaceInfo.tier === 'free' ? computeSpacePermissionsForFreeSpace : client.computeSpacePermissions
  )({
    resourceId: input.resourceId,
    // Sanitise value from HTTP request since it is sometimes 'undefined'
    userId: !stringUtils.isUUID(input.userId as string) ? undefined : input.userId
  });
  return result;
}

export async function toggleDefaultPublicPage(input: SpaceDefaultPublicPageToggle) {
  const result = await client.toggleSpaceDefaultPublicPage(input);
  return result;
}

export async function togglePublicBounties(input: PublicBountyToggle) {
  const result = await client.togglePublicBounties(input);
  return result;
}
