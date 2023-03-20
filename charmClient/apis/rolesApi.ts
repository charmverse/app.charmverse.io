import type { Role } from '@prisma/client';

import * as http from 'adapters/http';
import type { ListSpaceRolesResponse } from 'pages/api/roles';

export class RolesApi {
  createRole(role: Partial<Role>): Promise<Role> {
    return http.POST('/api/roles', role);
  }

  updateRole(role: Partial<Role>): Promise<Role> {
    return http.PUT(`/api/roles/${role.id}`, role);
  }

  deleteRole(roleId: string) {
    return http.DELETE(`/api/roles/${roleId}`);
  }

  listRoles(spaceId: string): Promise<ListSpaceRolesResponse[]> {
    return http.GET('/api/roles', { spaceId });
  }

  assignRole(data: { spaceId: string; roleId: string; userId: string }) {
    return http.POST('/api/roles/assignment', data);
  }

  unassignRole(data: { spaceId: string; roleId: string; userId: string }) {
    return http.DELETE('/api/roles/assignment', data);
  }
}
