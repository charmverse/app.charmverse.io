import { Prisma, Page, PagePermission, PagePermissionLevel } from '@prisma/client';
import { prisma } from 'db';

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
  view: 'View'
};

export const permissionDescriptions: Record<keyof IPagePermissionFlags, string> = {
  delete: 'delete page',
  read: 'view page',
  edit_content: 'edit page content',
  edit_contentText: 'edit page content',
  edit_headerImage: 'edit page header',
  edit_icon: 'edit page icon',
  edit_index: 'reorder page',
  edit_parentId: 'change linked page',
  edit_isPublic: 'share page',
  edit_path: 'edit path',
  edit_title: 'edit page title'
};

export class AllowedPagePermissions implements IPagePermissionFlags {

  read: boolean;

  delete: boolean;

  edit_index: boolean;

  edit_title: boolean;

  edit_content: boolean;

  edit_contentText: boolean;

  edit_headerImage: boolean;

  edit_icon: boolean;

  edit_isPublic: boolean;

  edit_path: boolean;

  edit_parentId: boolean;

  constructor (permissions: Partial<IPagePermissionFlags> = {}) {
    this.read = permissions.read ?? false;
    this.delete = permissions.delete ?? false;
    this.edit_index = permissions.edit_index ?? false;
    this.edit_title = permissions.edit_title ?? false;
    this.edit_content = permissions.edit_content ?? false;
    this.edit_contentText = permissions.edit_contentText ?? false;
    this.edit_headerImage = permissions.edit_headerImage ?? false;
    this.edit_icon = permissions.edit_icon ?? false;
    this.edit_isPublic = permissions.edit_isPublic ?? false;
    this.edit_path = permissions.edit_path ?? false;
    this.edit_parentId = permissions.edit_parentId ?? false;
  }

}

export const permissionTemplates: Record<keyof typeof PagePermissionLevel, Partial<IPagePermissionFlags>> = {
  full_access: {
    delete: true,
    read: true,
    edit_content: true,
    edit_contentText: true,
    edit_headerImage: true,
    edit_icon: true,
    edit_index: true,
    edit_parentId: true,
    edit_isPublic: true,
    edit_path: true,
    edit_title: true
  },
  editor: {
    read: true,
    edit_content: true,
    edit_contentText: true,
    edit_headerImage: true,
    edit_icon: true,
    edit_title: true
  },
  view_comment: {
    read: true
  },
  view: {
    read: true
  }
};

