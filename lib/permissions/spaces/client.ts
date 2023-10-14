import type { BaseSpacePermissionsClient } from '@charmverse/core/permissions';

import { computeSpacePermissions } from './computeSpacePermissions';

export class PublicSpacePermissionsClient implements BaseSpacePermissionsClient {
  computeSpacePermissions = computeSpacePermissions;
}
