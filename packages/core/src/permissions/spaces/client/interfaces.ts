import type { Space } from '@charmverse/core/prisma-client';

import type { PermissionCompute } from '../../core/interfaces';
import type { PublicBountyToggle, SpaceDefaultPublicPageToggle, SpacePermissionFlags } from '../interfaces';

export type SpacePermissionsClient = {
  computeSpacePermissions: (request: PermissionCompute) => Promise<SpacePermissionFlags>;
  toggleSpaceDefaultPublicPage: (request: SpaceDefaultPublicPageToggle) => Promise<Space>;
  togglePublicBounties: (request: PublicBountyToggle) => Promise<Space>;
};
