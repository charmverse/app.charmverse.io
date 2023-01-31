import { PostCategoryOperation, PostOperation } from '@prisma/client';

import { typedKeys } from 'lib/utilities/objects';

import type { AssignablePermissionGroupsWithPublic, UserPermissionFlags } from '../interfaces';

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
