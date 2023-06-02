import type { PagePermissionMeta } from '../interfaces';

import { permissionTemplates } from './page-permission-mapping';

export function pagePermissionGrantsEditAccess(permission: PagePermissionMeta): boolean {
  return permissionTemplates[permission.permissionLevel].includes('edit_content');
}
