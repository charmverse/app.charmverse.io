import type { PostCategoryOperation, PostCategoryPermissionLevel, PostOperation } from '@prisma/client';

import { postCategoryOperations, postOperationsWithoutEdit } from './interfaces';

export const postCategoryPermissionsMapping: Record<PostCategoryPermissionLevel, PostCategoryOperation[]> = {
  category_admin: [...postCategoryOperations],
  moderator: ['create_post'],
  member: ['create_post'],
  guest: [],
  custom: []
};

export const postPermissionsMapping: Record<PostCategoryPermissionLevel, PostOperation[]> = {
  category_admin: [...postOperationsWithoutEdit],
  moderator: [...postOperationsWithoutEdit],
  member: ['view_post', 'add_comment', 'upvote', 'downvote'],
  guest: ['view_post'],
  custom: []
};

export const postCategoryPermissionLabels: Record<PostCategoryPermissionLevel, string> = {
  category_admin: 'Category Admin',
  moderator: 'Moderator',
  member: 'Member',
  guest: 'Guest',
  custom: 'Custom'
} as const;
