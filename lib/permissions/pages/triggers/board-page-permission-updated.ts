import type { PagePermission, Prisma, PrismaPromise } from '@prisma/client';

import type { OptionalTransaction } from 'db';
import { prisma } from 'db';
import { flattenTree } from 'lib/pages/mapPageTree';
import { resolvePageTree } from 'lib/pages/server/resolvePageTree';
import { DataNotFoundError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';

import type { BoardPagePermissionUpdated } from '../interfaces';

/**
 * Generates the prisma operations for the board and its descendants
 * @param param0
 * @returns
 */
export async function generateboardPagePermissionUpdated ({ boardId, permissionId, tx = prisma }: BoardPagePermissionUpdated & OptionalTransaction):
 Promise<{ updateManyArgs?: Prisma.PagePermissionUpdateManyArgs, createManyArgs?: Prisma.PagePermissionCreateManyArgs }> {

  const permissionUpdates: Prisma.PagePermissionUpdateArgs [] = [];

  // Child page permission IDs that we will need to update
  const permissionUpdateManyIds: string[] = [];

  const permissionCreateMany: Prisma.PagePermissionCreateManyInput[] = [];

  const { parents: boardParents, targetPage: board } = await resolvePageTree({ pageId: boardId, tx });
  const boardChildren = flattenTree(board);

  const targetPermission = board.permissions.find(permission => permission.id === permissionId);

  if (!targetPermission) {
    throw new DataNotFoundError(`Permission not found: ${permissionId}`);
  }

  const reducedParents: Record<string, PagePermission[]> = boardParents.reduce((acc, parentPage) => {
    acc[parentPage.id] = parentPage.permissions;
    return acc;
  }, {} as Record<string, PagePermission[]>);

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

  const targetGroupKey = targetPermission.roleId ? 'roleId' : targetPermission.userId ? 'userId' : targetPermission.spaceId ? 'spaceId' : 'public';
  const targetGroupValue = targetPermission[targetGroupKey];

  boardChildren.forEach(childPage => {
    const matchingChildPagePermission = childPage.permissions.find(p => {
      return (p[targetGroupKey] === targetPermission[targetGroupKey]);
    });

    if (matchingChildPagePermission) {
      permissionUpdateManyIds.push(matchingChildPagePermission.id);
    }
    else {
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
      OR: permissionUpdateManyIds.map(id => {
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

export async function boardPagePermissionUpdated ({ boardId, permissionId, tx }: BoardPagePermissionUpdated & OptionalTransaction):
 Promise<true> {
  const args = await generateboardPagePermissionUpdated({ boardId, permissionId, tx });

  if (tx) {
    if (args.updateManyArgs) {
      await tx.pagePermission.updateMany(args.updateManyArgs);
    }

    if (args.createManyArgs) {
      await tx.pagePermission.createMany(args.createManyArgs);
    }
  }
  else {
    await prisma.$transaction([
      args.updateManyArgs ? prisma.pagePermission.updateMany(args.updateManyArgs) : null,
      args.createManyArgs ? prisma.pagePermission.createMany(args.createManyArgs) : null
    ].filter(a => isTruthy(a)) as PrismaPromise<any>[]);
  }

  return true;
}
