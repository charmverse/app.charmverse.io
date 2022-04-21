import { getPage, IPageWithPermissions, resolveChildPages, PageNotFoundError } from 'lib/pages';
import { inheritPermissions } from '../page-permission-actions';

export async function setupPermissionsAfterPagePermissionAdded (pageId: string): Promise<IPageWithPermissions> {
  const page = await getPage(pageId);

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  const children = await resolveChildPages(page.id);

  await Promise.all(children.map(child => {
    return inheritPermissions(page.id, child.id);
  }));

  return page;
}
