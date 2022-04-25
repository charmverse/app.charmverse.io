import { getPage, IPageWithPermissions, PageNotFoundError } from 'lib/pages';
import { upsertPermission } from '../v2/upsert-permission';

export async function setupPermissionsAfterPageBecameRoot (pageId: string): Promise<IPageWithPermissions> {
  const page = await getPage(pageId);

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  const newPermissions = await Promise.all(page.permissions.map(permission => {
    return upsertPermission(permission.pageId, permission);
  }));

  page.permissions = newPermissions;

  return page;
}
