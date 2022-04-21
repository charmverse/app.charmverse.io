import { IPageWithPermissions, getPage, resolveChildPages, resolveParentPages, PageNotFoundError } from 'lib/pages';
import { inheritPermissions, inheritPermissionsAcrossChildren } from '../page-permission-actions';
import { breakInheritance } from '../refresh-page-permission-tree';

/**
 * Should be called before the prisma update occurs
 * @param pageId
 * @param newParent
 */
export async function setupPermissionsAfterPageRepositioned (pageId: string, newParentId: string): Promise<IPageWithPermissions> {
  const [page, newParent] = await Promise.all([
    getPage(pageId),
    getPage(newParentId)
  ]);

  if (!page || !newParent) {
    throw new PageNotFoundError(!page ? pageId : newParentId);
  }

  const currentParentId = page.parentId;

  const parents = await resolveParentPages(page.id);

  const movedAbove = parents.findIndex(p => p.id === newParentId) > parents.findIndex(p => p.id === currentParentId);

  if (movedAbove) {
    await breakInheritance(page.id);
    await inheritPermissionsAcrossChildren(newParent.id, page.id);
    // TODO - flush permissions that can't be inherited
  }

  return page;

}
