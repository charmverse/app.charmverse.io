import type { PagePermission, Prisma, PrismaPromise } from '@prisma/client';
import { prisma } from 'db';
import type { IPageWithPermissions, PageNodeWithChildren, PageNodeWithPermissions } from 'lib/pages/server';
import { isTruthy } from 'lib/utilities/types';
import { replaceIllegalPermissions } from '../actions';
import { copyAllPagePermissions } from '../actions/copyPermission';
import { findExistingPermissionForGroup } from '../actions/find-existing-permission-for-group';
import { getPagePermission } from '../actions/get-permission';
import { hasSameOrMorePermissions } from '../actions/has-same-or-more-permissions';
import { PermissionNotFoundError } from '../errors';

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

  const updatedPage = await replaceIllegalPermissions({ pageId: foundPermission.pageId });

  const { permissions: permissionsToCopy } = updatedPage;

  // We want to compare the existing permissions of the parent page without the newly added permission
  const permissionsToCompare = updatedPage.permissions.filter(permission => permission.id !== permissionId);

  // We cannot do upsert many currently on Prisma. To keep the number of operations down, we will delete all relevant permissions and recreate them in 2 bulk operations. See https://stackoverflow.com/a/70824192
  const permissionsToDelete: Prisma.PagePermissionWhereInput[] = [];
  const permissionsToCreate: Prisma.PagePermissionCreateManyInput[] = [];

  function findChildPagesToCreatePermissionsFor (node: PageNodeWithChildren<PageNodeWithPermissions>): void {
    node.children.forEach(child => {

      const { permissions: childPermissions } = child;

      const canInherit = hasSameOrMorePermissions(permissionsToCompare, childPermissions);

      if (canInherit) {
        permissionsToDelete.push(...childPermissions.map(p => {
          return {
            id: p.id
          };
        }));

        const copied = copyAllPagePermissions({
          permissions: permissionsToCopy,
          newPageId: child.id,
          inheritFrom: true
        });

        permissionsToCreate.push(...(copied.data as Prisma.PagePermissionCreateManyInput[]));

        // This child can inherit, lets check its children
        findChildPagesToCreatePermissionsFor(child);
      }

    });
  }

  findChildPagesToCreatePermissionsFor(updatedPage);

  await prisma.$transaction([
    permissionsToDelete.length > 0 ? prisma.pagePermission.deleteMany({ where: { OR: permissionsToDelete } }) : null,
    prisma.pagePermission.createMany({ data: permissionsToCreate })
  ].filter(a => isTruthy(a)) as PrismaPromise<any>[]);

  return true;
}
