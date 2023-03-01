import * as http from 'adapters/http';
import type { PermissionCompute } from 'lib/permissions/interfaces';
import type { IPagePermissionFlags } from 'lib/permissions/pages';

export class PagePermissionsApi {
  computePagePermissions({ pageIdOrPath, spaceDomain }: { pageIdOrPath: string; spaceDomain?: string }) {
    return http.POST<IPagePermissionFlags>(`/api/permissions/pages/compute-page-permissions`, {
      resourceId: !spaceDomain ? pageIdOrPath : `${spaceDomain}/${pageIdOrPath}`
    } as PermissionCompute);
  }
}
