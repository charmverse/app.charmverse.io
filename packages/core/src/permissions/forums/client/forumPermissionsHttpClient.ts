import { AbstractPermissionsApiClient } from '../../clients/abstractApiClient.class';
import type { PermissionCompute, PermissionResource, Resource } from '../../core/interfaces';
import * as forumController from '../../permissionsApi/controllers/forum';
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
  getPermissionedCategories(userAndCategories: CategoriesToFilter): Promise<PostCategoryWithPermissions[]> {
    return forumController.getPermissionedCategories(userAndCategories);
  }

  computePostPermissions(request: PermissionCompute): Promise<PostPermissionFlags> {
    return forumController.computePostPermissions(request);
  }

  computePostCategoryPermissions(request: PermissionCompute): Promise<PostCategoryPermissionFlags> {
    return forumController.computePostCategoryPermissions(request);
  }

  assignDefaultPostCategoryPermissions(postCategory: Resource): Promise<void> {
    return forumController.assignDefaultPostCategoryPermissions(postCategory);
  }

  upsertPostCategoryPermission(request: PostCategoryPermissionAssignment): Promise<AssignedPostCategoryPermission> {
    return forumController.upsertPostCategoryPermission(request);
  }

  deletePostCategoryPermission(request: PermissionResource): Promise<void> {
    return forumController.deletePostCategoryPermission(request);
  }

  mutatePostCategorySearch(request: PostSearchToMutate): Promise<MutatedPostSearch> {
    return forumController.mutatePostCategorySearch(request);
  }
}
