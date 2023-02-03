import type { PostCategoryPermissionLevel } from '@prisma/client';

import { postCategoryPermissionLabels } from 'lib/permissions/forum/mapping';

// eslint-disable-next-line camelcase
const { category_admin, moderator, custom, ...options } = postCategoryPermissionLabels;
export const permissionsWithRemove = { ...options, delete: 'Remove' };

export const forumMemberPermissionOptions = options;

export type BulkRolePostCategoryPermissionUpsert = { permissionLevel: PostCategoryPermissionLevel; roleIds: string[] };
