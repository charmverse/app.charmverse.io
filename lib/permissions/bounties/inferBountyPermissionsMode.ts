import { typedKeys } from 'lib/utilities/objects';

import type { BountyPermissions, InferredBountyPermissionMode } from './interfaces';

// Utility for inferring if a bounty is for a space or for roles
export function inferBountyPermissionsMode (permissions: Partial<BountyPermissions>): InferredBountyPermissionMode {
  if (!permissions) {
    return { mode: 'space' };
  }

  const keys = typedKeys(permissions);

  // Find space permission
  for (const permissionLevel of keys) {
    if (permissions[permissionLevel]) {
      const spacePermission = permissions[permissionLevel]?.find(p => p.group === 'space');

      if (spacePermission) {
        return { mode: 'space' };
      }
    }
  }

  const foundRoles: string [] = [];

  // Find role permission
  for (const permissionLevel of keys) {
    const rolePermissions = permissions[permissionLevel]?.filter(p => p.group === 'role') ?? [];

    rolePermissions.forEach(p => {
      foundRoles.push(p.id as string);
    });

  }

  if (foundRoles.length > 0) {
    return {
      mode: 'role',
      roles: foundRoles
    };
  }

  // Default to space
  return { mode: 'space' };
}
