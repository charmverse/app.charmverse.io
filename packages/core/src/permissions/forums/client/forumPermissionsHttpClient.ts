import { DELETE, GET, POST } from '../../../http/index';
import { AbstractPermissionsApiClient } from '../../clients/abstractApiClient.class';
import type { PermissionsApiClientConstructor } from '../../clients/interfaces';
import type { PermissionCompute, PermissionResource, Resource } from '../../core/interfaces';
import type {
  AssignedPostCategoryPermission,
  CategoriesToFilter,
  MutatedPostSearch,
  PostCategoryPermissionAssignment,
  PostCategoryPermissionFlags,
  PostCategoryWithPermissions,
  PostPermissionFlags,
  PostSearchToMutate
} from '../interfaces';

import type { PremiumForumPermissionsClient } from './interfaces';

export class ForumPermissionsHttpClient extends AbstractPermissionsApiClient implements PremiumForumPermissionsClient {
  private get prefix() {
    return `${this.baseUrl}/api/forum`;
  }

  // eslint-disable-next-line no-useless-constructor
  constructor(params: PermissionsApiClientConstructor) {
    super(params);
  }

  getPermissionedCategories(userAndCategories: CategoriesToFilter): Promise<PostCategoryWithPermissions[]> {
    return POST(`${this.prefix}/get-permissioned-categories`, userAndCategories, {
      headers: this.jsonHeaders
    });
  }

  computePostPermissions(request: PermissionCompute): Promise<PostPermissionFlags> {
    return GET(`${this.prefix}/compute-post-permissions`, request);
  }

  computePostCategoryPermissions(request: PermissionCompute): Promise<PostCategoryPermissionFlags> {
    return GET(`${this.prefix}/compute-post-category-permissions`, request);
  }

  assignDefaultPostCategoryPermissions(postCategory: Resource): Promise<void> {
    return POST(`${this.prefix}/assign-default-post-category-permissions`, postCategory, {
      headers: this.jsonHeaders
    });
  }

  upsertPostCategoryPermission(request: PostCategoryPermissionAssignment): Promise<AssignedPostCategoryPermission> {
    return POST(`${this.prefix}/upsert-post-category-permission`, request, { headers: this.jsonHeaders });
  }

  deletePostCategoryPermission(request: PermissionResource): Promise<void> {
    return DELETE(`${this.prefix}/delete-post-category-permission`, request, { headers: this.jsonHeaders });
  }

  mutatePostCategorySearch(request: PostSearchToMutate): Promise<MutatedPostSearch> {
    return POST(`${this.prefix}/mutate-post-category-search`, request, {
      headers: this.jsonHeaders
    });
  }
}
