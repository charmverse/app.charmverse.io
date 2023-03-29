import type { AssignablePermissionGroups } from './interfaces';

export function permissionGroupIsValid(group: AssignablePermissionGroups): boolean {
  if (group !== 'role' && group !== 'space' && group !== 'user') {
    return false;
  }

  return true;
}
