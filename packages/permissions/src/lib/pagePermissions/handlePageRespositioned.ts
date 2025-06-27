import type { Prisma, PrismaTransactionClient } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { PageNotFoundError } from '@packages/core/errors';
import type {
  PageWithPermissions,
  TargetPageTreeWithFlatChildren,
  PageNodeWithPermissions
} from '@packages/core/pages';
import { pageTree } from '@packages/core/pages';

import { replaceIllegalPermissions } from './replaceIllegalPermissions';
import { upsertPagePermission } from './upsertPagePermission';
import { findExistingPermissionForGroup } from './utilities/find-existing-permission-for-group';
import { hasSameOrMorePermissions } from './utilities/hasSameOrMorePermissions';
import { mapPagePermissionToAssignee } from './utilities/mapPagePermissionToAssignee';

type HandlerProps = {
  pageId: string;
  tx?: Prisma.TransactionClient;
};

/**
 * When updating the position of a page within the space page tree, call this function immediately afterwards
 *
 * @abstract This function used to implement alot more. It has been left as a wrapper around the newly provided replaceIllegalPermissions to keep the codebase clean, and allow for additional changes to behaviour in future
 */
export async function handlePageRepositioned({ pageId, tx: _tx }: HandlerProps): Promise<PageWithPermissions> {
  if (!_tx) {
    return prisma.$transaction(txHandler, { timeout: 20000 });
  }

  return txHandler(_tx);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  async function txHandler(tx: PrismaTransactionClient) {
    const page =
      typeof pageId === 'string'
        ? await tx.page.findUnique({
            where: {
              id: pageId
            },
            select: {
              id: true,
              parentId: true,
              permissions: true
            }
          })
        : pageId;

    if (!page) {
      throw new PageNotFoundError(pageId as string);
    }

    const updatedPage = await replaceIllegalPermissions({ pageId: page.id, tx });

    if (updatedPage.parentId) {
      const parent = await tx.page.findUnique({
        where: {
          id: updatedPage.parentId
        },
        select: {
          id: true,
          permissions: {
            include: {
              sourcePermission: true
            }
          }
        }
      });

      if (parent && hasSameOrMorePermissions(parent.permissions, updatedPage.permissions)) {
        const permissionsToCopy = parent.permissions.filter((p) => {
          const matchingGroupPermission = findExistingPermissionForGroup(
            mapPagePermissionToAssignee({ permission: p }),
            updatedPage.permissions,
            true
          );

          return matchingGroupPermission?.permissionLevel === p.permissionLevel;
        });
        if (permissionsToCopy.length > 0) {
          const treeWithChildren: TargetPageTreeWithFlatChildren<PageNodeWithPermissions> = {
            parents: updatedPage.tree.parents,
            targetPage: updatedPage.tree.targetPage,
            flatChildren: pageTree.flattenTree(updatedPage.tree.targetPage)
          };

          await Promise.all(
            permissionsToCopy.map((p) =>
              upsertPagePermission({
                pageId: updatedPage.id,
                permission: mapPagePermissionToAssignee({ permission: p }),
                resolvedPageTree: treeWithChildren,
                tx
              })
            )
          );
        }
      }
    }

    return tx.page.findUnique({
      where: { id: updatedPage.id },
      include: { permissions: { include: { sourcePermission: true } } }
    }) as Promise<PageWithPermissions>;
  }
}
