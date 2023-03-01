/* eslint-disable no-console */
import type { Prisma } from '@prisma/client';

import type { TransactionClient } from 'db';
import { prisma } from 'db';
import type { PageNodeWithChildren, PageNodeWithPermissions } from 'lib/pages/server';

import { replaceIllegalPermissions } from '../actions';
import { copyAllPagePermissions } from '../actions/copyPermission';
import { getPagePermission } from '../actions/get-permission';
import { hasSameOrMorePermissions } from '../actions/has-same-or-more-permissions';
import { PermissionNotFoundError } from '../errors';

export async function setupPermissionsAfterPagePermissionAdded(
  permissionId: string,
  transaction?: TransactionClient
): Promise<boolean> {
  if (!transaction) {
    return prisma.$transaction(txHandler);
  }

  return txHandler(transaction);

  async function txHandler(tx: TransactionClient) {
    const foundPermission = await getPagePermission(permissionId, tx);

    if (!foundPermission) {
      throw new PermissionNotFoundError(permissionId);
    }

    const updatedPage = await replaceIllegalPermissions({ pageId: foundPermission.pageId, tx });

    const { permissions: permissionsToCopy } = updatedPage;

    // We want to compare the existing permissions of the parent page without the newly added permission
    const permissionsToCompare = updatedPage.permissions.filter((permission) => permission.id !== permissionId);

    // We cannot do upsert many currently on Prisma. To keep the number of operations down, we will delete all relevant permissions and recreate them in 2 bulk operations. See https://stackoverflow.com/a/70824192
    const permissionsToDelete: string[] = [];
    const permissionsToCreate: Prisma.PagePermissionCreateManyInput[] = [];

    function findChildPagesToCreatePermissionsFor(node: PageNodeWithChildren<PageNodeWithPermissions>): void {
      node.children.forEach((child) => {
        const { permissions: childPermissions } = child;

        const canInherit = hasSameOrMorePermissions(permissionsToCompare, childPermissions);

        if (canInherit) {
          permissionsToDelete.push(...childPermissions.map((p) => p.id));

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
    console.timeEnd('01-tx-----');
    if (permissionsToDelete.length > 0) {
      await tx.pagePermission.deleteMany({ where: { id: { in: permissionsToDelete } } });
    }

    await tx.pagePermission.createMany({ data: permissionsToCreate });

    return true;
  }
}
