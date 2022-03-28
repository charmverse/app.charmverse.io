
import { PagePermission, PagePermissionLevel, SpaceRole, PageOperations as PageOperationEnum } from '@prisma/client';

export type PageOperationType = keyof typeof PageOperationEnum

export type PagePermissionLevelType = keyof typeof PagePermissionLevel

export type IPagePermissionFlags = Record<PageOperationType, boolean>

export interface IPagePermissionListRequest {
  pageId: string
}

export interface IPagePermissionRequest extends IPagePermissionListRequest {
  userId: string,
  pageId: string
}

export type IPagePermissionToAdd = Pick<PagePermission, 'spaceId' | 'userId' | 'roleId' | 'pageId' | 'permissionLevel' | 'permissions'>

export interface IPagePermissionWithNestedSpaceRole extends PagePermission {
  page: {
    space: {
      spaceRoles: SpaceRole []
    }
  }
}
