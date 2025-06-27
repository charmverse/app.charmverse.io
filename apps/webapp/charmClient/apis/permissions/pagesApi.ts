import * as http from '@packages/adapters/http';
import type { UpdatePagePermissionDiscoverabilityRequest } from '@packages/core/pages';
import type { PagePermissionFlags } from '@packages/core/permissions';
import type { PermissionCompute } from '@packages/lib/permissions/interfaces';

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
