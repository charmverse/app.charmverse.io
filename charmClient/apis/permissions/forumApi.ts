import * as http from 'adapters/http';
import type {
  AssignedPostCategoryPermission,
  AvailablePostCategoryPermissionFlags,
  AvailablePostPermissionFlags
} from 'lib/permissions/forum/interfaces';
import type { PostCategoryPermissionInput } from 'lib/permissions/forum/upsertPostCategoryPermission';
import type { PermissionCompute, PermissionToDelete } from 'lib/permissions/interfaces';
import type { PermissionsGroupQuery } from 'lib/permissions/proposals/listGroupProposalCategoryPermissions';

export class ForumPermissionsApi {
  computePostPermissions({ postIdOrPath, spaceDomain }: { postIdOrPath: string; spaceDomain?: string }) {
    return http.POST<AvailablePostPermissionFlags>(`/api/permissions/forum/compute-post-permissions`, {
      resourceId: !spaceDomain ? postIdOrPath : `${spaceDomain}/${postIdOrPath}`
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

  listGroupPostCategoryPermissions(query: PermissionsGroupQuery) {
    return http.GET<AssignedPostCategoryPermission[]>(
      '/api/permissions/forum/list-group-post-category-permissions',
      query
    );
  }
}
