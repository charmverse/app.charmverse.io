import { getPage, IPageWithPermissions, PageNotFoundError, resolveParentPages } from 'lib/pages';
import { upsertPermission, findExistingPermissionForGroup, hasSameOrMorePermissions } from '../actions';

/**
 * Should be called before the prisma update occurs
 * @param pageId
 * @param newParent
 */
export async function setupPermissionsAfterPageRepositioned (pageId: string): Promise<IPageWithPermissions> {
  const page = await getPage(pageId);

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  const parents = await resolveParentPages(page.id);

  // Search for inherited permissions to redefine locally
  const permissionsToUpdate = page.permissions.filter(inheritedPermission => {
    if (!inheritedPermission.inheritedFromPermission) {
      return false;
    }

    // Go up the tree to ensure the inheritance link is never broken
    for (const parent of parents) {
      const permissionExistsInParent = parent.permissions.find(permission => {
        return (permission.id === inheritedPermission.inheritedFromPermission
          || permission.inheritedFromPermission === inheritedPermission.inheritedFromPermission);
      });

      // Inheritance should be broken
      if (!permissionExistsInParent) {
        return true;
      }
      // We found the source permission. This can stay unchanged
      else if (permissionExistsInParent && permissionExistsInParent.id === inheritedPermission.inheritedFromPermission) {
        return false;
      }
    }

    // We didn't find the source permission for some reason. Redefine permissions locally
    return true;
  });

  // Break the inheritance
  await Promise.all(permissionsToUpdate.map(permission => {
    return upsertPermission(page.id, permission);
  }));

  // --- Downwards
  // Check that this permission can inherit from new parent and apply missing permissions
  if (page.parentId) {
    const [pageAfterRefresh, parentPage] = await Promise.all([
      getPage(page.id),
      getPage(page.parentId)
    ]) as IPageWithPermissions[];

    if (parentPage) {
      const canInherit = hasSameOrMorePermissions(parentPage.permissions, pageAfterRefresh.permissions);

      if (canInherit) {
        const permissionsToAdd = parentPage.permissions.filter(parentPerm => {
          const existingChildPermissionForSameGroup = findExistingPermissionForGroup(parentPerm, pageAfterRefresh.permissions);

          // Add missing permissions and re-establish inheritance in new tree
          if (!existingChildPermissionForSameGroup || existingChildPermissionForSameGroup.permissionLevel === parentPerm.permissionLevel) {
            return true;
          }
          return false;
        });

        await Promise.all(permissionsToAdd.map(perm => {
          return upsertPermission(pageAfterRefresh.id, perm);
        }));
      }
    }
  }

  const pageWithUpdatedPermissions = await getPage(page.id) as IPageWithPermissions;

  return pageWithUpdatedPermissions;

}
