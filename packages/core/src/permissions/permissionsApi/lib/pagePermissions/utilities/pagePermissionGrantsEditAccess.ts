import type { PagePermissionMeta } from '@packages/core/permissions';

import { permissionTemplates } from '../mapping';

export function pagePermissionGrantsEditAccess(permission: PagePermissionMeta): boolean {
  return permissionTemplates[permission.permissionLevel].includes('edit_content');
}
