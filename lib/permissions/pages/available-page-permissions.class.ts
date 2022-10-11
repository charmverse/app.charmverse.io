import { PageOperations } from '@prisma/client';

import { Permissions } from '../permissions.class';

import type { IPagePermissionFlags, PageOperationType } from './page-permission-interfaces';

/**
 * Provides a set of page permissions
 *
 * Permissions can be added, but not removed.
 */
export class AllowedPagePermissions extends Permissions<PageOperationType> {

  read: boolean = false;

  delete: boolean = false;

  comment: boolean = false;

  create_poll: boolean = false;

  edit_position: boolean = false;

  edit_content: boolean = false;

  edit_isPublic: boolean = false;

  edit_path: boolean = false;

  grant_permissions: boolean = false;

  constructor (initialPermissions: PageOperationType [] | Partial<IPagePermissionFlags> = []) {

    super({
      allowedOperations: Object.keys(PageOperations) as PageOperationType[]
    });

    this.addPermissions(initialPermissions);
  }

}
