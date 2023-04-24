import type { PostCategoryOperation, PostCategoryPermissionLevel, PostOperation } from '@charmverse/core/dist/prisma';

import { postCategoryOperations, postOperationsWithoutEdit } from './interfaces';

export const postCategoryPermissionsMapping: Record<PostCategoryPermissionLevel, PostCategoryOperation[]> = {
  category_admin: [...postCategoryOperations],
  moderator: ['create_post'],
  full_access: ['create_post'],
  comment_vote: [],
  view: [],
  custom: []
};

export const postPermissionsMapping: Record<PostCategoryPermissionLevel, PostOperation[]> = {
  category_admin: [...postOperationsWithoutEdit],
  moderator: [...postOperationsWithoutEdit],
  full_access: ['view_post', 'add_comment', 'upvote', 'downvote'],
  comment_vote: ['view_post', 'add_comment', 'upvote', 'downvote'],
  view: ['view_post'],
  custom: []
};
