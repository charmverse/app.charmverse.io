import type { PostCategoryPermission } from '@prisma/client';

import * as http from 'adapters/http';
import type {
  AvailablePostCategoryPermissionFlags,
  AvailablePostPermissionFlags,
  AssignedPostCategoryPermission
} from 'lib/permissions/forum/interfaces';
import type { PostCategoryPermissionInput } from 'lib/permissions/forum/upsertPostCategoryPermission';
import type { PermissionCompute, PermissionToDelete } from 'lib/permissions/interfaces';

export class PermissionsApi {
  computePostPermissions(postId: string) {
    return http.POST<AvailablePostPermissionFlags>(`/api/permissions/forum/compute-post-permissions`, {
      resourceId: postId
    } as PermissionCompute);
  }

  computePostCategoryPermissions(postCategoryId: string) {
    return http.POST<AvailablePostCategoryPermissionFlags>(`/api/permissions/forum/compute-post-category-permissions`, {
      resourceId: postCategoryId
    } as PermissionCompute);
  }

  upsertPostCategoryPermission(permissionInput: PostCategoryPermissionInput) {
    return http.POST<AssignedPostCategoryPermission>('/api/permissions/forum', permissionInput);
  }

  deletePostCategoryPermission(permissionId: string) {
    return http.DELETE('/api/permissions/forum', { permissionId } as PermissionToDelete);
  }

  listPostCategoryPermissions(postCategoryId: string) {
    return http.GET<AssignedPostCategoryPermission[]>('/api/permissions/forum/list-post-category-permissions', {
      resourceId: postCategoryId
    } as PermissionCompute);
  }
}
