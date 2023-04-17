import type { PostCategoryPermissionLevel } from '@prisma/client';

export const postCategoryPermissionLabels: Record<PostCategoryPermissionLevel, string> = {
  category_admin: 'Category Admin',
  moderator: 'Moderator',
  full_access: 'Post & Comment',
  vote_comment: 'Vote & Comment',
  view: 'View',
  custom: 'Custom'
} as const;

// eslint-disable-next-line camelcase
const { category_admin, moderator, custom, ...options } = postCategoryPermissionLabels;

export const forumMemberPermissionOptions = options;
export type BulkRolePostCategoryPermissionUpsert = { permissionLevel: PostCategoryPermissionLevel; roleIds: string[] };
