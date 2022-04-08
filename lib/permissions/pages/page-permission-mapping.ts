import { PageOperations, PagePermissionLevel } from '@prisma/client';
import { PageOperationType } from './page-permission-interfaces';

export const permissionLevels: Record<keyof typeof PagePermissionLevel, string> = {
  full_access: 'Full access',
  editor: 'Edit page and properties',
  content_editor: 'Edit page content',
  view_comment: 'View and comment',
  view: 'View',
  custom: 'Custom'
};

// User-friendly descriptions for each permission
// Also usable as a constant to iterate through current page permissions in various code
export const permissionDescriptions: Record<PageOperationType, string> = {
  delete: 'delete page',
  read: 'view page',
  edit_database_schema: 'edit available properties in databases',
  edit_properties: 'edit properties of a page in a database',
  edit_restricted_properties: 'edit protected properties of a page in a database',
  edit_title: 'edit page title',
  edit_content: 'edit page content',
  edit_position: 'reposition page',
  edit_isPublic: 'share page',
  edit_path: 'edit page URL',
  grant_permissions: 'manage page access'
};

export const permissionTemplates: Record<keyof typeof PagePermissionLevel, PageOperationType []> = {
  full_access: Object.keys(PageOperations) as PageOperationType [],
  editor: ['read', 'edit_content', 'edit_title', 'edit_properties', 'edit_restricted_properties'],
  content_editor: ['read', 'edit_content', 'edit_properties'],
  view_comment: ['read'],
  view: ['read'],
  // Implemented at the database level
  custom: []
};

