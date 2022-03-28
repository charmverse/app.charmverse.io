
import { PagePermission, PagePermissionLevel, SpaceRole, PageOperations as PageOperationEnum, Role, Space, User } from '@prisma/client';

export type PageOperationType = keyof typeof PageOperationEnum

export type PagePermissionLevelType = keyof typeof PagePermissionLevel

export type IPagePermissionFlags = Record<PageOperationType, boolean>

export interface IPagePermissionRequest {
  pageId: string
}

export interface IPagePermissionUserRequest extends IPagePermissionRequest {
  userId: string,
  pageId: string
}

export interface IPagePermissionToDelete {
  permissionId: string
}

export interface IPagePermissionWithNestedSpaceRole extends PagePermission {
  page: {
    space: {
      spaceRoles: SpaceRole []
    }
  }
}

export interface IPagePermissionWithAssignee extends PagePermission {
  user: User | null;
  role: Role | null;
  space: Space | null;
}

