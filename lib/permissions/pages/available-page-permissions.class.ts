import { PageOperations } from '@prisma/client';
import { IPagePermissionFlags, PageOperationType } from './page-permission-interfaces';

/**
 * Provides a set of page permissions
 *
 * Permissions can be added, but not removed.
 */
export class AllowedPagePermissions implements IPagePermissionFlags {

  read: boolean = false;

  delete: boolean = false;

  edit_position: boolean = false;

  edit_content: boolean = false;

  edit_isPublic: boolean = false;

  edit_path: boolean = false;

  grant_permissions: boolean = false;

  constructor (initialPermissions: PageOperationType [] | Partial<IPagePermissionFlags> = []) {

    this.addPermissions(initialPermissions);
  }

  addPermissions (permissions: PageOperationType [] | Partial<IPagePermissionFlags>) {

    if (permissions instanceof Array) {
      permissions.forEach(permissionName => {
        if (PageOperations[permissionName]) {
          this[permissionName] = true;
        }
      });
    }
    else {
      const permissionKeys = Object.keys(permissions) as PageOperationType [];
      permissionKeys.forEach(permissionName => {

        if (PageOperations[permissionName] && permissions[permissionName] === true) {
          this[permissionName] = true;
        }

      });
    }
  }

  /**
   * Given a list of operations, indicates if all these are available in current permission set
   */
  hasPermissions (operations: PageOperationType []): boolean {
    for (const op of operations) {
      if (this[op] !== true) {
        return false;
      }
    }

    return true;
  }

}
