import { PagePermission } from '@prisma/client';
import { prisma } from 'db';
import { PageNotFoundError } from 'lib/public-api';
import { AllowedPagePermissions } from './available-page-permissions.class';
import { permissionTemplates } from './page-permission-mapping';

/**
 * Ensures that a set of comparison permissions contains at least the same or more permissions than the base compared against
 * @abstract There can only be 1 page permission per space, role or user. This is enforced at the database level
 */
export function hasFullSetOfBasePermissions (basePermissions: PagePermission [], comparisonPermissions: PagePermission []): boolean {

  for (const permission of basePermissions) {
    const comparisonPermission = comparisonPermissions.find(permissionToCompare => {

      if (permission.spaceId) {
        return permissionToCompare.spaceId === permission.spaceId;
      }
      else if (permission.roleId) {
        return permissionToCompare.roleId === permission.roleId;
      }
      else if (permission.userId) {
        return permissionToCompare.userId === permission.userId;
      }
      else {
        return false;
      }

    });

    if (!comparisonPermission) {
      return false;
    }

    const availableCompare = new AllowedPagePermissions(comparisonPermission.permissionLevel === 'custom' ? comparisonPermission.permissions : permissionTemplates[permission.permissionLevel]);

    const hasSameOrMore = availableCompare.hasPermissions(permission.permissionLevel === 'custom' ? permission.permissions : permissionTemplates[permission.permissionLevel]);

    if (hasSameOrMore === false) {
      return false;
    }

  }

  return true;

}

