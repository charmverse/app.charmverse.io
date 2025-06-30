import * as http from '@packages/adapters/http';
import type {
  PostCategoryPermissionAssignment,
  AssignedPostCategoryPermission,
  PostCategoryPermissionFlags,
  PostPermissionFlags
} from '@packages/core/permissions';
import type { PermissionCompute, PermissionResource } from '@packages/lib/permissions/interfaces';

export class ForumPermissionsApi {
  computePostPermissions({ postIdOrPath, spaceDomain }: { postIdOrPath: string; spaceDomain?: string }) {
    return http.POST<PostPermissionFlags>(`/api/permissions/forum/compute-post-permissions`, {
      resourceId: !spaceDomain ? postIdOrPath : `${spaceDomain}/${postIdOrPath}`
    } as PermissionCompute);
  }

  computePostCategoryPermissions(postCategoryId: string) {
    return http.POST<PostCategoryPermissionFlags>(`/api/permissions/forum/compute-post-category-permissions`, {
      resourceId: postCategoryId
    } as PermissionCompute);
  }

  upsertPostCategoryPermission(permissionInput: PostCategoryPermissionAssignment) {
    return http.POST<AssignedPostCategoryPermission>('/api/permissions/forum', permissionInput);
  }

  deletePostCategoryPermission(permissionId: string) {
    return http.DELETE('/api/permissions/forum', { permissionId } as PermissionResource);
  }

  listPostCategoryPermissions(resourceId: string) {
    return http.GET<AssignedPostCategoryPermission[]>('/api/permissions/forum/list-post-category-permissions', {
      resourceId
    });
  }
}
