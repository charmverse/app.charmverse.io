import type { UpdatePagePermissionDiscoverabilityRequest } from '@charmverse/core/pages';
import type { PagePermissionFlags } from '@charmverse/core/permissions';
import * as http from '@root/adapters/http';

import type { PermissionCompute } from 'lib/permissions/interfaces';

export class PagePermissionsApi {
  computePagePermissions({ pageIdOrPath, spaceDomain }: { pageIdOrPath: string; spaceDomain?: string }) {
    return http.POST<PagePermissionFlags>(`/api/permissions/pages/compute-page-permissions`, {
      resourceId: !spaceDomain ? pageIdOrPath : `${spaceDomain}/${pageIdOrPath}`
    } as PermissionCompute);
  }

  updatePagePermissionDiscoverability(body: UpdatePagePermissionDiscoverabilityRequest): Promise<void> {
    return http.PUT('/api/permissions/pages/update-page-discoverability', body);
  }
}
