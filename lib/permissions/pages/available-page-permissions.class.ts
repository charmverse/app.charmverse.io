import { PageOperations } from '@prisma/client';

import { typedKeys } from 'lib/utilities/objects';

import { BasePermissions } from '../basePermissions.class';

import type { IPagePermissionFlags, PageOperationType } from './page-permission-interfaces';

/**
 * Provides a set of page permissions
 *
 * Permissions can be added, but not removed.
 */
export class AllowedPagePermissions extends BasePermissions<PageOperationType> {
  constructor(initialPermissions: PageOperationType[] | Partial<IPagePermissionFlags> = []) {
    super({
      allowedOperations: typedKeys(PageOperations)
    });

    this.addPermissions(initialPermissions);
  }
}
