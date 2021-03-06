import { PageOperations, PagePermissionLevel } from '@prisma/client';
import { PageOperationType } from './page-permission-interfaces';

export const permissionLevels: Record<keyof typeof PagePermissionLevel, string> = {
  full_access: 'Full access',
  editor: 'Edit',
  view_comment: 'View and comment',
  view: 'View',
  custom: 'Custom'
};

// User-friendly descriptions for each permission
// Also usable as a constant to iterate through current page permissions in various code
export const permissionDescriptions: Record<PageOperationType, string> = {
  delete: 'delete page',
  read: 'view page',
  comment: 'comment page content',
  edit_content: 'edit page content',
  edit_position: 'reposition page',
  edit_isPublic: 'share page',
  edit_path: 'edit page URL',
  grant_permissions: 'manage page access'
};

export const permissionTemplates: Record<keyof typeof PagePermissionLevel, PageOperationType []> = {
  full_access: Object.keys(PageOperations) as PageOperationType [],
  editor: ['read', 'edit_content', 'comment'],
  view_comment: ['read', 'comment'],
  view: ['read'],
  // Implemented at the database level
  custom: []
};

