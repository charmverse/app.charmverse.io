import type { Space } from '@charmverse/core/prisma-client';

import { AbstractPermissionsApiClient } from '../../clients/abstractApiClient.class';
import type { PermissionCompute } from '../../core/interfaces';
import * as spacesController from '../../permissionsApi/controllers/spaces';
import type { PublicBountyToggle, SpaceDefaultPublicPageToggle, SpacePermissionFlags } from '../interfaces';

import type { SpacePermissionsClient } from './interfaces';

export class SpacePermissionsHttpClient extends AbstractPermissionsApiClient implements SpacePermissionsClient {
  computeSpacePermissions(request: PermissionCompute): Promise<SpacePermissionFlags> {
    return spacesController.computeSpacePermissions(request);
  }

  toggleSpaceDefaultPublicPage(request: SpaceDefaultPublicPageToggle): Promise<Space> {
    return spacesController.toggleDefaultPublicPage(request);
  }

  togglePublicBounties(request: PublicBountyToggle): Promise<Space> {
    return spacesController.togglePublicBounties(request);
  }
}
