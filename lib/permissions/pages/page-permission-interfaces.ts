
import type { PagePermission, PagePermissionLevel, SpaceRole, PageOperations as PageOperationEnum, Role, Space, User, Page } from '@prisma/client';

import type { UserPermissionFlags } from '../interfaces';

export type PageOperationType = keyof typeof PageOperationEnum

export type PagePermissionLevelType = keyof typeof PagePermissionLevel

export type PagePermissionLevelWithoutCustom = Exclude<PagePermissionLevelType, 'custom'>

export type IPagePermissionFlags = UserPermissionFlags<PageOperationType>

/**
 * Use for requesting all permissions for a page
 */
export interface IPagePermissionRequest {
  pageId: string;
}

/**
 * Use for requesting permissions a user can exercise on a specific page
 * @allowAdminBypass Admins always get full permissions. Defaults to true. Set to false to remove this override
 */
export interface IPagePermissionUserRequest extends IPagePermissionRequest {
  userId?: string;
  allowAdminBypass?: boolean;
}

/**
 * Provide one of userId, spaceId or roleId
 * @pageId can be passed in the body or externally
 */
export type IPagePermissionToCreate = Pick<PagePermission, 'permissionLevel'> & Partial<Pick<PagePermission, 'permissions' | 'userId' | 'spaceId' | 'roleId' | 'public' | 'pageId' | 'inheritedFromPermission' | 'id'>>
export type IPagePermissionToInherit = Pick<PagePermission, 'pageId' | 'inheritedFromPermission'>

export type IPagePermissionUpdate = Pick<PagePermission, 'permissionLevel'> & Partial<Pick<PagePermission, 'permissions'>>

export interface IPagePermissionToDelete {
  permissionId: string;
}

export interface IPagePermissionWithSource extends PagePermission {
  sourcePermission: PagePermission | null;
}

export interface IPageWithNestedSpaceRole extends Page {
  space: {
    spaceRoles: SpaceRole [];
  };
}

export interface IPagePermissionWithAssignee extends PagePermission, IPagePermissionWithSource {
  user: User | null;
  role: Role | null;
  space: Space | null;
  public: boolean | null;
}

export interface SpaceDefaultPublicPageToggle {
  spaceId: string;
  defaultPublicPages: boolean;
}
