import type { PagePermission, PagePermissionLevel } from '@prisma/client';

import { AllowedPagePermissions } from '../available-page-permissions.class';
import type { PageOperationType } from '../page-permission-interfaces';
import { permissionTemplates } from '../page-permission-mapping';

import { findExistingPermissionForGroup } from './find-existing-permission-for-group';

/**
 * Ensures that a set of comparison permissions contains at least the same or more permissions than the base compared against
 * @abstract There can only be 1 page permission per space, role or user. This is enforced at the database level
 */
export function hasSameOrMorePermissions (basePermissions: PagePermission [], comparisonPermissions: PagePermission []): boolean {

  for (const basePerm of basePermissions) {
    const comparePerm = findExistingPermissionForGroup(basePerm, comparisonPermissions, true);

    if (!comparePerm) {
      return false;
    }

    const availableCompare = new AllowedPagePermissions(comparePerm.permissionLevel === 'custom' ? comparePerm.permissions : permissionTemplates[comparePerm.permissionLevel]);

    // Pass the base set of permissions and ensure the comparison has at least all of these
    const hasSameOrMore = availableCompare.hasPermissions(basePerm.permissionLevel === 'custom' ? basePerm.permissions : permissionTemplates[basePerm.permissionLevel]);

    if (hasSameOrMore === false) {
      return false;
    }
  }
  return true;
}

interface PermissionLevelComparison {
  base: PagePermissionLevel | PageOperationType[];
  comparison: PagePermissionLevel | PageOperationType[];
}

type PermissionLevelComparisonResult = 'equal' | 'more' | 'less' | 'different';

export function comparePermissionLevels ({ base, comparison }: PermissionLevelComparison): PermissionLevelComparisonResult {
  const baseOperations = base instanceof Array ? base : permissionTemplates[base];
  const compareOperations = comparison instanceof Array ? comparison : permissionTemplates[comparison];

  const basePermissions = new AllowedPagePermissions(baseOperations);
  const comparePermissions = new AllowedPagePermissions(compareOperations);

  const compareHasBase = comparePermissions.hasPermissions(baseOperations);

  if (compareHasBase) {
    return compareOperations.length === baseOperations.length ? 'equal' : 'more';
  }

  const baseHasCompare = basePermissions.hasPermissions(compareOperations);

  if (baseHasCompare) {
    return 'less';
  }

  return 'different';
}
