import type { PagePermission, Prisma, PrismaPromise } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { pageTree, resolvePageTree } from '@packages/core/pages';

import { PagePermissionNotFoundError } from './errors';
import { getPagePermission } from './getPagePermission';

type HandlerProps = {
  permissionId: string;
  tx?: Prisma.TransactionClient;
};

/**
 * Generates the prisma operations for the board and its descendants
 * @param param0
 * @returns
 */
export async function generateBoardPagePermissionUpdatedArgs({ permissionId, tx = prisma }: HandlerProps): Promise<{
  updateManyArgs?: Prisma.PagePermissionUpdateManyArgs;
  createManyArgs?: Prisma.PagePermissionCreateManyArgs;
}> {
  const { pageId: boardId } = await getPagePermission({ permissionId, tx });

  const permissionUpdates: Prisma.PagePermissionUpdateArgs[] = [];

  // Child page permission IDs that we will need to update
  const permissionUpdateManyIds: string[] = [];

  const permissionCreateMany: Prisma.PagePermissionCreateManyInput[] = [];

  const { parents: boardParents, targetPage: board } = await resolvePageTree({ pageId: boardId, tx });
  const boardChildren = pageTree.flattenTree(board);

  const targetPermission = board.permissions.find((permission) => permission.id === permissionId);

  if (!targetPermission) {
    throw new PagePermissionNotFoundError(permissionId);
  }

  const reducedParents: Record<string, PagePermission[]> = boardParents.reduce(
    (acc, parentPage) => {
      acc[parentPage.id] = parentPage.permissions;
      return acc;
    },
    {} as Record<string, PagePermission[]>
  );

  // Make sure the inheritance relationship is valid. If not, drop the inheritance relationship
  if (targetPermission.sourcePermission && !reducedParents[targetPermission.sourcePermission.pageId]) {
    delete (targetPermission as any).sourcePermission;
    permissionUpdates.push({
      where: {
        id: targetPermission.id
      },
      data: {
        sourcePermission: {
          disconnect: true
        }
      }
    });
  }

  // The permission ID we should inherit from
  const targetPermissionId = targetPermission.sourcePermission?.id ?? targetPermission.id;

  const targetGroupKey = targetPermission.roleId
    ? 'roleId'
    : targetPermission.userId
      ? 'userId'
      : targetPermission.spaceId
        ? 'spaceId'
        : 'public';
  const targetGroupValue = targetPermission[targetGroupKey];

  boardChildren.forEach((childPage) => {
    const matchingChildPagePermission = childPage.permissions.find((p) => {
      return p[targetGroupKey] === targetPermission[targetGroupKey];
    });

    if (matchingChildPagePermission) {
      permissionUpdateManyIds.push(matchingChildPagePermission.id);
    } else {
      permissionCreateMany.push({
        pageId: childPage.id,
        [targetGroupKey]: targetGroupValue,
        permissionLevel: targetPermission.permissionLevel,
        inheritedFromPermission: targetPermissionId
      });
    }
  });

  /**
   * 1. Detect if board inheritance for target permissions should be dropped as page is outside the tree
   * 2. Resolve the children of the board => Make sure the child permissions don't inherit above the board
   */

  const updateOperation: Prisma.PagePermissionUpdateManyArgs = {
    where: {
      OR: permissionUpdateManyIds.map((id) => {
        return {
          id
        };
      })
    },
    data: {
      inheritedFromPermission: targetPermissionId,
      permissionLevel: targetPermission.permissionLevel
    }
  };

  const createOperation: Prisma.PagePermissionCreateManyArgs = {
    data: permissionCreateMany
  };

  return {
    updateManyArgs: permissionUpdateManyIds.length > 0 ? updateOperation : undefined,
    createManyArgs: permissionCreateMany.length > 0 ? createOperation : undefined
  };
}

export async function handleBoardPagePermissionUpdated({ permissionId, tx }: HandlerProps): Promise<true> {
  const args = await generateBoardPagePermissionUpdatedArgs({ permissionId, tx });

  if (tx) {
    if (args.updateManyArgs) {
      await tx.pagePermission.updateMany(args.updateManyArgs);
    }

    if (args.createManyArgs) {
      await tx.pagePermission.createMany(args.createManyArgs);
    }
  } else {
    await prisma.$transaction(
      [
        args.updateManyArgs ? prisma.pagePermission.updateMany(args.updateManyArgs) : null,
        args.createManyArgs ? prisma.pagePermission.createMany(args.createManyArgs) : null
      ].filter((a) => !!a) as PrismaPromise<any>[]
    );
  }

  return true;
}
