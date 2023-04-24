import type { PostCategory, PostCategoryPermissionLevel } from '@charmverse/core/dist/prisma';
import { PostCategoryOperation, PostOperation } from '@charmverse/core/dist/prisma';

import { typedKeys } from 'lib/utilities/objects';

import type { AssignablePermissionGroupsWithPublic, TargetPermissionGroup, UserPermissionFlags } from '../interfaces';

export type AssignablePostCategoryPermissionGroups = Extract<
  AssignablePermissionGroupsWithPublic,
  'role' | 'space' | 'public'
>;

export const postCategoryPermissionGroups: AssignablePostCategoryPermissionGroups[] = ['role', 'space', 'public'];

export const postOperations = [...typedKeys(PostOperation)] as const;
export const postCategoryOperations = [...typedKeys(PostCategoryOperation)] as const;
// Used in most cases, as only an author should be able to edit their post
export const postOperationsWithoutEdit = postOperations.filter((operation) => operation !== 'edit_post');

export type AvailablePostPermissionFlags = UserPermissionFlags<PostOperation>;
export type AvailablePostCategoryPermissionFlags = UserPermissionFlags<PostCategoryOperation>;

export type AssignedPostCategoryPermission<
  T extends AssignablePostCategoryPermissionGroups = AssignablePostCategoryPermissionGroups
> = {
  id: string;
  postCategoryId: string;
  permissionLevel: PostCategoryPermissionLevel;
  assignee: TargetPermissionGroup<T>;
};
/**
 * When returning post categories, also pre-compute if a user can add a post to that category
 */
export type PostCategoryWithPermissions = PostCategory & { permissions: AvailablePostCategoryPermissionFlags };
