import type { PostCategoryOperation, PostCategoryPermissionLevel, PostOperation } from '@prisma/client';

import { postCategoryOperations, postOperationsWithoutEdit } from './interfaces';

export const postCategoryPermissionsMapping: Record<PostCategoryPermissionLevel, PostCategoryOperation[]> = {
  category_admin: [...postCategoryOperations],
  moderator: ['create_post'],
  full_access: ['create_post'],
  view: [],
  custom: []
};

export const postPermissionsMapping: Record<PostCategoryPermissionLevel, PostOperation[]> = {
  category_admin: [...postOperationsWithoutEdit],
  moderator: [...postOperationsWithoutEdit],
  full_access: ['view_post', 'add_comment', 'upvote', 'downvote'],
  view: ['view_post'],
  custom: []
};

export const postCategoryPermissionLabels: Record<PostCategoryPermissionLevel, string> = {
  category_admin: 'Category Admin',
  moderator: 'Moderator',
  full_access: 'Full Access',
  view: 'View',
  custom: 'Custom'
} as const;
