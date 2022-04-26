import { getPage, PageNotFoundError } from 'lib/pages/server';
import { IPagePermissionToCreate } from '../page-permission-interfaces';
import { findExistingPermissionForGroup } from './find-existing-permission-for-group';

/**
 * Check if the parent page has a permission with the same access level as the one we are assigning. If so, return permission ID to inherit from
 * @param page
 * @param permission
 */
export async function checkParentForSamePermission (pageId: string, permission: IPagePermissionToCreate): Promise<string | null> {

  const page = await getPage(pageId);

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  if (!page.parentId) {
    return null;
  }

  const parent = await getPage(page.parentId);

  if (!parent) {
    return null;
  }

  const matchingPermission = findExistingPermissionForGroup(permission, parent.permissions);

  if (!matchingPermission) {
    return null;
  }

  return matchingPermission.inheritedFromPermission ?? matchingPermission.id;
}
