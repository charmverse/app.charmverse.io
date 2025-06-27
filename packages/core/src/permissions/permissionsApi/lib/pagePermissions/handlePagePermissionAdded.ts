/* eslint-disable no-console */

import type { Prisma } from '@charmverse/core/prisma';
import type { PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { PageNodeWithChildren, PageNodeWithPermissions } from '@packages/core/pages';
import { copyAllPagePermissions } from '@packages/core/permissions';

import { getPagePermission } from './getPagePermission';
import { replaceIllegalPermissions } from './replaceIllegalPermissions';
import { hasSameOrMorePermissions } from './utilities/hasSameOrMorePermissions';

type HandlerProps = {
  permissionId: string;
  tx?: Prisma.TransactionClient;
};

export async function handlePagePermissionAdded({ permissionId, tx: _tx }: HandlerProps): Promise<boolean> {
  if (!_tx) {
    return prisma.$transaction(txHandler);
  }

  return txHandler(_tx);

  async function txHandler(tx: PrismaTransactionClient) {
    const foundPermission = await getPagePermission({ permissionId, tx });

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
    if (permissionsToDelete.length > 0) {
      await tx.pagePermission.deleteMany({ where: { id: { in: permissionsToDelete } } });
    }

    await tx.pagePermission.createMany({ data: permissionsToCreate });

    return true;
  }
}
