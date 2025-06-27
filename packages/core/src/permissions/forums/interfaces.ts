import { PostCategoryOperation, PostOperation } from '@charmverse/core/prisma-client';
import type { PostCategory, PostCategoryPermissionLevel } from '@charmverse/core/prisma-client';

import { typedKeys } from '../../utilities/objects';
import type { AssignablePermissionGroups, TargetPermissionGroup, UserPermissionFlags } from '../core/interfaces';

export type PostPermissionFlags = UserPermissionFlags<PostOperation>;
export type PostCategoryPermissionFlags = UserPermissionFlags<PostCategoryOperation>;
export type AssignablePostCategoryPermissionGroups = Extract<AssignablePermissionGroups, 'role' | 'space' | 'public'>;

export type PostCategoryPermissionAssignment<
  T extends AssignablePostCategoryPermissionGroups = AssignablePostCategoryPermissionGroups
> = {
  postCategoryId: string;
  permissionLevel: PostCategoryPermissionLevel;
  assignee: TargetPermissionGroup<T>;
};

export type AssignedPostCategoryPermission<
  T extends AssignablePostCategoryPermissionGroups = AssignablePostCategoryPermissionGroups
> = PostCategoryPermissionAssignment<T> & {
  id: string;
};

export type PostSearchToMutate = {
  categoryId?: string | string[];
  spaceId: string;
  userId?: string;
};

export type MutatedPostSearch = {
  categoryId?: string | string[];
};

/**
 * When returning post categories, also pre-compute if a user can add a post to that category
 */
export type PostCategoryWithPermissions = PostCategory & { permissions: PostCategoryPermissionFlags };

/**
 * Used for returning a subset of post categories
 */
export type CategoriesToFilter = {
  postCategories: PostCategory[];
  userId?: string;
};

export const postCategoryPermissionGroups: AssignablePostCategoryPermissionGroups[] = ['role', 'space', 'public'];

export const postOperations = [...typedKeys(PostOperation)] as const;
export const postCategoryOperations = [...typedKeys(PostCategoryOperation)] as const;
// Used in most cases, as only an author should be able to edit their post
export const postOperationsWithoutEdit = postOperations.filter((operation) => operation !== 'edit_post');
