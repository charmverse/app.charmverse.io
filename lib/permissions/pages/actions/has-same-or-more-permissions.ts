import { PagePermission } from '@prisma/client';
import { AllowedPagePermissions } from '../available-page-permissions.class';
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
