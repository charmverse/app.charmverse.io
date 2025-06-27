import type { PermissionCompute, PermissionResource, Resource } from '../../core/interfaces';
import type {
  PostPermissionFlags,
  PostCategoryPermissionFlags,
  CategoriesToFilter,
  PostCategoryWithPermissions,
  PostCategoryPermissionAssignment,
  AssignedPostCategoryPermission,
  PostSearchToMutate,
  MutatedPostSearch
} from '../interfaces';

export type BaseForumPermissionsClient = {
  computePostPermissions: (request: PermissionCompute) => Promise<PostPermissionFlags>;
  computePostCategoryPermissions: (request: PermissionCompute) => Promise<PostCategoryPermissionFlags>;
  getPermissionedCategories: (userAndCategories: CategoriesToFilter) => Promise<PostCategoryWithPermissions[]>;
};
export type PremiumForumPermissionsClient = BaseForumPermissionsClient & {
  assignDefaultPostCategoryPermissions: (postCategory: Resource) => Promise<void>;
  upsertPostCategoryPermission: (
    assignment: PostCategoryPermissionAssignment
  ) => Promise<AssignedPostCategoryPermission>;
  deletePostCategoryPermission: (permission: PermissionResource) => Promise<void>;
  mutatePostCategorySearch: (search: PostSearchToMutate) => Promise<MutatedPostSearch>;
};
