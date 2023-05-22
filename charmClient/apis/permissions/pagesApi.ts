import type { PagePermissionFlags } from '@charmverse/core';

import * as http from 'adapters/http';
import type { PermissionCompute } from 'lib/permissions/interfaces';

export class PagePermissionsApi {
  computePagePermissions({ pageIdOrPath, spaceDomain }: { pageIdOrPath: string; spaceDomain?: string }) {
    return http.POST<PagePermissionFlags>(`/api/permissions/pages/compute-page-permissions`, {
      resourceId: !spaceDomain ? pageIdOrPath : `${spaceDomain}/${pageIdOrPath}`
    } as PermissionCompute);
  }
}
