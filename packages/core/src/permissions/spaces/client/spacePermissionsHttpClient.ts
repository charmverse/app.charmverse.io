import type { Space } from '@charmverse/core/prisma-client';

import { GET, POST } from '../../../http';
import { AbstractPermissionsApiClient } from '../../clients/abstractApiClient.class';
import type { PermissionCompute } from '../../core/interfaces';
import type { PublicBountyToggle, SpaceDefaultPublicPageToggle, SpacePermissionFlags } from '../interfaces';

import type { SpacePermissionsClient } from './interfaces';

export class SpacePermissionsHttpClient extends AbstractPermissionsApiClient implements SpacePermissionsClient {
  private get prefix() {
    return `${this.baseUrl}/api/spaces`;
  }

  computeSpacePermissions(request: PermissionCompute): Promise<SpacePermissionFlags> {
    return GET(`${this.prefix}/compute-space-permissions`, request);
  }

  toggleSpaceDefaultPublicPage(request: SpaceDefaultPublicPageToggle): Promise<Space> {
    return POST(`${this.prefix}/toggle-default-public-page`, request, {
      headers: this.jsonHeaders
    });
  }

  togglePublicBounties(request: PublicBountyToggle): Promise<Space> {
    return POST(`${this.prefix}/toggle-public-bounties`, request, {
      headers: this.jsonHeaders
    });
  }
}
