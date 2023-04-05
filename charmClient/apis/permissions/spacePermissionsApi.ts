import type { PagePermissionLevel, Space } from '@prisma/client';

import * as http from 'adapters/http';
import type { SpacePermissionConfigurationUpdate } from 'lib/permissions/meta/interfaces';
import type { SpacePermissionFlags, SpacePermissionModification } from 'lib/permissions/spaces';
import type { SpacePermissions } from 'lib/permissions/spaces/listPermissions';

export class SpacePermissionsApi {
  computeUserSpacePermissions({ spaceId }: { spaceId: string }): Promise<SpacePermissionFlags> {
    return http.GET<SpacePermissionFlags>(`/api/permissions/space/${spaceId}/compute`);
  }

  listSpacePermissions(resourceId: string): Promise<SpacePermissions> {
    return http.GET<SpacePermissions>(`/api/permissions/space/${resourceId}/list`);
  }

  addSpacePermissions({
    forSpaceId,
    operations,
    roleId,
    spaceId,
    userId
  }: SpacePermissionModification): Promise<SpacePermissionFlags> {
    return http.POST<SpacePermissionFlags>(`/api/permissions/space/${forSpaceId}/add`, {
      operations,
      roleId,
      spaceId,
      userId
    } as Omit<SpacePermissionModification, 'forSpaceId'>);
  }

  removeSpacePermissions({
    forSpaceId,
    operations,
    roleId,
    spaceId,
    userId
  }: SpacePermissionModification): Promise<SpacePermissionFlags> {
    return http.POST<SpacePermissionFlags>(`/api/permissions/space/${forSpaceId}/remove`, {
      operations,
      roleId,
      spaceId,
      userId
    } as Omit<SpacePermissionModification, 'forSpaceId'>);
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
