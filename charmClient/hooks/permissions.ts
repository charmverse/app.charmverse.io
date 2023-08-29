import type {
  AssignedPagePermission,
  PagePermissionAssignment,
  PagePermissionWithSource,
  PermissionResource
} from '@charmverse/core/permissions';

import { useDELETE, useGET, usePOST } from './helpers';

// Getters

export function useGetPermissions(pageId?: string | null) {
  return useGET<AssignedPagePermission[]>(pageId ? '/api/permissions' : null, { pageId });
}

// Mutations

export function useCreatePermissions() {
  return usePOST<PagePermissionAssignment, PagePermissionWithSource>('/api/permissions');
}

export function useDeletePermissions() {
  return useDELETE<PermissionResource>('/api/permissions');
}
