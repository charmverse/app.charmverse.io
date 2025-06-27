import { PageOperations } from '@charmverse/core/prisma-client';

import { typedKeys } from '../../utilities/objects';
import { BasePermissions } from '../core/basePermissions.class';

const readonlyOperations: PageOperations[] = ['read'];

/**
 * Provides a set of page permissions
 *
 * Permissions can be added, but not removed.
 */
export class AvailablePagePermissions extends BasePermissions<PageOperations> {
  constructor({ isReadonlySpace }: { isReadonlySpace: boolean }) {
    const allowedOperations = isReadonlySpace ? readonlyOperations : typedKeys(PageOperations);
    super({ allowedOperations });
  }
}
