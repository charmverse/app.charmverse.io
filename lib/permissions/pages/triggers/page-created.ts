import { getPage, IPageWithPermissions, PageNotFoundError } from 'lib/pages/server';
import { upsertPermission } from '../actions/upsert-permission';

export async function setupPermissionsAfterPageCreated (pageId: string): Promise<IPageWithPermissions> {
  const page = await getPage(pageId);

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  // This is a root page, so we can go ahead
  if (!page.parentId) {
    await upsertPermission(
      pageId,
      {
        permissionLevel: 'full_access',
        spaceId: page.spaceId
      }
    );
  }
  else {
    const parent = (await getPage(page.parentId) as IPageWithPermissions);
    await Promise.all(parent.permissions.map(permission => {
      return upsertPermission(page.id, permission.id);
    }));
  }

  const pageWithPermissions = await getPage(page.id) as IPageWithPermissions;

  return pageWithPermissions;
}
