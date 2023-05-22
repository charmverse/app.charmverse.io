import type { BaseSpacePermissionsClient } from '@charmverse/core';

import { computeSpacePermissions } from './computeSpacePermissions';

export class PublicSpacePermissionsClient implements BaseSpacePermissionsClient {
  computeSpacePermissions = computeSpacePermissions;
}
