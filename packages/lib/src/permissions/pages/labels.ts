import type { PagePermissionLevel } from '@charmverse/core/prisma-client';

/**
 * The types of page permission levels that we actually use when assigning page permission levels
 */
export type ApplicablePagePermissionLevel = Extract<
  PagePermissionLevel,
  'full_access' | 'editor' | 'view_comment' | 'view'
>;

export const pagePermissionLevels: Record<ApplicablePagePermissionLevel, string> = {
  full_access: 'Full access',
  editor: 'Editor',
  view_comment: 'View & Comment',
  view: 'View'
};
