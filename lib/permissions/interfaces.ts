import { PagePermission, Page } from '@prisma/client';
import { IPagePermissionFlags } from './pages';

export interface IPermissionRequestIdentifiers {
  userId: string,
  spaceId: string,
  resourceId: string
}

interface IEntityPermissionFlags {
  page?: Array<keyof IPagePermissionFlags>
}

export interface IUserPermissionsRequest {
  identifiers: IPermissionRequestIdentifiers,
}

export interface IActionRequest extends IUserPermissionsRequest {
  permissions: IEntityPermissionFlags
}
