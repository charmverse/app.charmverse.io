import type { BaseSpacePermissionsClient } from '@charmverse/core/permissions';

import { listAvailableBounties } from 'lib/bounties/listAvailableBounties';

import { computeSpacePermissions } from './computeSpacePermissions';

export class PublicSpacePermissionsClient implements BaseSpacePermissionsClient {
  listAvailableBounties = listAvailableBounties;

  computeSpacePermissions = computeSpacePermissions;
}
