import type { PagePermissionLevel } from '@charmverse/core/prisma';
import { PageOperations } from '@charmverse/core/prisma';

export const permissionTemplates: Record<keyof typeof PagePermissionLevel, PageOperations[]> = {
  full_access: Object.keys(PageOperations) as PageOperations[],
  editor: ['read', 'edit_content', 'comment', 'create_poll', 'delete_attached_bounty', 'edit_lock'],
  view_comment: ['read', 'comment', 'create_poll'],
  view: ['read'],
  // Implemented at the database level
  custom: []
};
