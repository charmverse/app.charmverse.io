import { PagePermission } from '@prisma/client';
import { getPage, IPageWithPermissions, resolveChildPages } from 'lib/pages/server';
import { PermissionNotFoundError } from '../errors';
import { findExistingPermissionForGroup } from '../actions/find-existing-permission-for-group';
import { getPagePermission } from '../actions/get-permission';
import { hasSameOrMorePermissions } from '../actions/has-same-or-more-permissions';
import { upsertPermission } from '../actions/upsert-permission';

/**
 * If the page doesn't have this permission locally defined, then they can inherit it
 * The page should otherwise also have the same set of permissions
 * @param page
 * @param permission
 */
function canInheritNewPermission (page: IPageWithPermissions, parentPage: IPageWithPermissions, permission: PagePermission): boolean {
  const pageHasExistingPermission = findExistingPermissionForGroup(permission, page.permissions);

  if (pageHasExistingPermission) {
    return false;
  }

  const filteredParentPermissions = parentPage.permissions.filter(perm => {
    return perm.id !== permission.id && perm.inheritedFromPermission !== permission.id;
  });

  // Make sure the other permissions are in line
  return hasSameOrMorePermissions(filteredParentPermissions, page.permissions);

}

export async function setupPermissionsAfterPagePermissionAdded (permissionId: string): Promise<true> {

  const foundPermission = await getPagePermission(permissionId);

  if (!foundPermission) {
    throw new PermissionNotFoundError(permissionId);
  }

  return applyRecursively(foundPermission.pageId, foundPermission);

  // Recursion happens here
  async function applyRecursively (parentPageId: string, permission: PagePermission): Promise<true> {
    const parent = await getPage(parentPageId) as IPageWithPermissions;
    const children = await resolveChildPages(parentPageId, false);

    const childrenToCreatePermissionFor = children.filter(child => {
      return canInheritNewPermission(child, parent, permission);
    });

    await Promise.all(childrenToCreatePermissionFor.map(child => {
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve) => {
        await upsertPermission(child.id, permission.id);

        if (child.children?.length > 0) {
          await applyRecursively(child.id, permission);
        }
        resolve(true);
      });
    }));

    return true;
  }

}
