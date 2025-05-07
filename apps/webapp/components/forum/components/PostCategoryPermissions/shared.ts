import type { PostCategoryPermissionLevel } from '@charmverse/core/prisma';

export const postCategoryPermissionLabels: Record<PostCategoryPermissionLevel, string> = {
  category_admin: 'Category Admin',
  moderator: 'Moderator',
  full_access: 'Post, Vote & Comment',
  comment_vote: 'Vote & Comment',
  view: 'View',
  custom: 'Custom'
} as const;

// eslint-disable-next-line camelcase
const { category_admin, moderator, custom, ...options } = postCategoryPermissionLabels;

export const forumMemberPermissionOptions = options;
