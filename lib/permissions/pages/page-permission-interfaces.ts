
import { PagePermission, PagePermissionLevel, SpaceRole, PageOperations as PageOperationEnum, Role, Space, User, Page } from '@prisma/client';

export type PageOperationType = keyof typeof PageOperationEnum

export type PagePermissionLevelType = keyof typeof PagePermissionLevel

export type IPagePermissionFlags = Record<PageOperationType, boolean>

/**
 * Use for requesting all permissions for a page
 */
export interface IPagePermissionRequest {
  pageId: string
}

/**
 * Use for requesting permissions a user can exercise on a specific page
 */
export interface IPagePermissionUserRequest extends IPagePermissionRequest {
  userId: string;
}

/**
 * Provide one of userId, spaceId or roleId
 */
export type IPagePermissionToCreate = Pick<PagePermission, 'pageId' | 'permissionLevel'> & Partial<Pick<PagePermission, 'permissions' | 'userId' | 'spaceId' | 'roleId' | 'inheritedFromPage'>>

export type IPagePermissionUpdate = Pick<PagePermission, 'permissionLevel'> & Partial<Pick<PagePermission, 'permissions'>>

export interface IPagePermissionToDelete {
  permissionId: string
}

export interface IPageWithPermissions extends Page {
  permissions: PagePermission []
}

export interface IPageWithNestedSpaceRole extends Page {
  space: {
    spaceRoles: SpaceRole []
  }
}

export interface IPagePermissionWithAssignee extends PagePermission {
  user: User | null;
  role: Role | null;
  space: Space | null;
}

