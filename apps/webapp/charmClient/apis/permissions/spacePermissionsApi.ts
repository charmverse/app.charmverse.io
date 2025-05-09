import type { PagePermissionLevel, Space } from '@charmverse/core/prisma';
import * as http from '@packages/adapters/http';

import type { SpacePermissionConfigurationUpdate } from '@packages/lib/permissions/meta/interfaces';
import type { SpacePermissionFlags } from '@packages/lib/permissions/spaces';
import type { SpacePermissions } from '@packages/lib/permissions/spaces/listPermissions';

export class SpacePermissionsApi {
  computeUserSpacePermissions({ spaceId }: { spaceId: string }): Promise<SpacePermissionFlags> {
    return http.GET<SpacePermissionFlags>(`/api/permissions/space/${spaceId}/compute`);
  }

  listSpacePermissions(resourceId: string): Promise<SpacePermissions> {
    return http.GET<SpacePermissions>(`/api/permissions/space/${resourceId}/settings`);
  }

  saveSpacePermissions(resourceId: string, permissions: SpacePermissions & { roleIdToTrack?: string }) {
    return http.POST(`/api/permissions/space/${resourceId}/settings`, permissions);
  }

  setDefaultPagePermission({
    spaceId,
    pagePermissionLevel
  }: {
    spaceId: string;
    pagePermissionLevel: PagePermissionLevel | null;
  }) {
    return http.POST<Space>(`/api/spaces/${spaceId}/set-default-page-permissions`, {
      pagePermissionLevel
    });
  }

  setSpacePermissionMode({ permissionConfigurationMode, spaceId }: SpacePermissionConfigurationUpdate) {
    return http.POST<Space>(`/api/spaces/${spaceId}/set-permissions-mode`, { permissionConfigurationMode });
  }
}
