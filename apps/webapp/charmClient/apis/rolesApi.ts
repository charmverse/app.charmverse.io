import type { Role } from '@charmverse/core/prisma';
import * as http from '@packages/adapters/http';

import type { ListSpaceRolesResponse } from 'pages/api/roles';
import type { CreateRoleInput } from 'pages/api/roles/index';

export class RolesApi {
  createRole(role: CreateRoleInput): Promise<Role> {
    return http.POST('/api/roles', role);
  }

  updateRole(role: Partial<Role>): Promise<Role> {
    return http.PUT(`/api/roles/${role.id}`, role);
  }

  deleteRole(roleId: string) {
    return http.DELETE(`/api/roles/${roleId}`);
  }

  listRoles(spaceId: string, includeArchived = false): Promise<ListSpaceRolesResponse[]> {
    return http.GET('/api/roles', { spaceId, includeArchived });
  }

  assignRole(data: { spaceId: string; roleId: string; userId: string }) {
    return http.POST('/api/roles/assignment', data);
  }

  unassignRole(data: { spaceId: string; roleId: string; userId: string }) {
    return http.DELETE('/api/roles/assignment', data);
  }

  archiveRole(roleId: string) {
    return http.PUT(`/api/roles/${roleId}/archive`);
  }

  unarchiveRole(roleId: string) {
    return http.PUT(`/api/roles/${roleId}/unarchive`);
  }
}
