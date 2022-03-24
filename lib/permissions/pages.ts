import { Page, PagePermission, PagePermissionLevel } from '@prisma/client';
import { prisma } from 'db';
import { IPermissionRequestIdentifiers } from './interfaces';

// export type IPagePermission = IEntityPermission<Page> & {pageId: string}

export type IPagePermissionFlags = Omit<PagePermission, 'id' | 'spaceId' | 'userId' | 'roleId' | 'pageId' | 'permissionLevel'>

const PermissionLevelTitle: Record<keyof typeof PagePermissionLevel, string> = {
  full_access: 'Edit, delete and share',
  editor: 'Edit page',
  view_comment: 'View and comment',
  view: 'View'
};

const permissionDescriptions: Record<keyof IPagePermissionFlags, string> = {
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

const permissionTemplates: Record<keyof typeof PagePermissionLevel, Partial<IPagePermissionFlags>> = {
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

export async function evaluatePagePermission (
  request: IPermissionRequestIdentifiers,
  requiredPermissions: Array<keyof IPagePermissionFlags>
): Promise<boolean> {

  // Get roles
  // Get permissions for role

  const roles = await prisma.role.findMany({
    where: {
      spaceRolesToRole: {
        some: {
          spaceRole: {
            userId: request.userId,
            spaceId: request.spaceId
          }
        }
      }
    }
  });

  console.log('Found user roles');

  const permissions = await prisma.pagePermission.findMany({
    where: {}
  });

  return true;

}

