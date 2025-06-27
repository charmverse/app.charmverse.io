import type { SpacePermissionsClient as SpacePermissionsClientInterface } from '@packages/core/permissions';

import { computeSpacePermissions } from './computeSpacePermissions';
import { togglePublicBounties } from './togglePublicBounties';
import { toggleSpaceDefaultPublicPage } from './toggleSpaceDefaultPublicPage';

export class SpacePermissionsClient implements SpacePermissionsClientInterface {
  computeSpacePermissions = computeSpacePermissions;

  toggleSpaceDefaultPublicPage = toggleSpaceDefaultPublicPage;

  togglePublicBounties = togglePublicBounties;
}
