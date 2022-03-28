import { PagePermission, PagePermissionLevel } from '@prisma/client';

// export type IPagePermission = IEntityPermission<Page> & {pageId: string}

export type IPagePermissionFlags = Omit<PagePermission, 'id' | 'spaceId' | 'userId' | 'roleId' | 'pageId' | 'permissionLevel'>

export interface IPagePermissionListRequest {
  pageId: string
}

export interface IPagePermissionRequest extends IPagePermissionListRequest {
  userId: string,
  pageId: string
}

export type IPagePermissionToAdd = Pick<PagePermission, 'spaceId' | 'userId' | 'roleId' | 'pageId' | 'permissionLevel'>

export const PermissionLevelTitle: Record<keyof typeof PagePermissionLevel, string> = {
  full_access: 'Edit, delete and share',
  editor: 'Edit page',
  view_comment: 'View and comment',
  view: 'View',
  custom: 'Custom'
};

export const permissionDescriptions: Record<keyof IPagePermissionFlags, string> = {
  delete: 'delete page',
  read: 'view page',
  edit_content: 'edit page content',
  edit_position: 'reposition page',
  edit_isPublic: 'share page',
  edit_path: 'edit page URL'
};

export class AllowedPagePermissions implements IPagePermissionFlags {

  read: boolean;

  delete: boolean;

  edit_position: boolean;

  edit_content: boolean;

  edit_isPublic: boolean;

  edit_path: boolean;

  constructor (permissions: Partial<IPagePermissionFlags> = {}) {
    this.read = permissions.read ?? false;
    this.delete = permissions.delete ?? false;
    this.edit_content = permissions.edit_content ?? false;
    this.edit_isPublic = permissions.edit_isPublic ?? false;
    this.edit_path = permissions.edit_path ?? false;
    this.edit_position = permissions.edit_position ?? false;
  }

}

export const permissionTemplates: Record<keyof typeof PagePermissionLevel, Partial<IPagePermissionFlags>> = {
  full_access: {
    delete: true,
    read: true,
    edit_content: true,
    edit_position: true,
    edit_isPublic: true,
    edit_path: true
  },
  editor: {
    read: true,
    edit_content: true
  },
  view_comment: {
    read: true
  },
  view: {
    read: true
  },
  // Implemented at the database level
  custom: {}
};

