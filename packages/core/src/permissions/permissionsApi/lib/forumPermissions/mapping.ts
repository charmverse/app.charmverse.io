import { PostCategoryOperation, PostOperation } from '@charmverse/core/prisma';
import type { PostCategoryPermissionLevel } from '@charmverse/core/prisma';
import type { AssignablePostCategoryPermissionGroups } from '@packages/core/permissions';
import { objectUtils } from '@packages/core/utilities';

export const postCategoryPermissionGroups: AssignablePostCategoryPermissionGroups[] = ['role', 'space', 'public'];

export const postOperations = [...objectUtils.typedKeys(PostOperation)] as const;
export const postCategoryOperations = [...objectUtils.typedKeys(PostCategoryOperation)] as const;
// Used in most cases, as only an author should be able to edit their post
export const postOperationsWithoutEdit = postOperations.filter((operation) => operation !== 'edit_post');

export const postCategoryPermissionsMapping: Record<PostCategoryPermissionLevel, PostCategoryOperation[]> = {
  category_admin: [...postCategoryOperations],
  moderator: ['create_post', 'view_posts', 'comment_posts'],
  full_access: ['create_post', 'view_posts', 'comment_posts'],
  comment_vote: ['view_posts', 'comment_posts'],
  view: ['view_posts'],
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
