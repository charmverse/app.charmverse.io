import type { AssignablePermissionGroupsWithPublic } from '../interfaces';

export type AssignablePostCategoryPermissionGroups = Extract<
  AssignablePermissionGroupsWithPublic,
  'role' | 'space' | 'public'
>;

export const postCategoryPermissionGroups: AssignablePostCategoryPermissionGroups[] = ['role', 'space', 'public'];
