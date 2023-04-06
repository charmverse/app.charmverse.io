import type { PagePermission, PagePermissionLevel, Prisma } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import type { IPageWithPermissions } from 'lib/pages';
import { getPage, resolvePageTree } from 'lib/pages/server';
import { DataNotFoundError } from 'lib/utilities/errors';

import { upsertPermission } from '../actions';

import { setupPermissionsAfterPageRepositioned } from './page-repositioned';

export async function lockToBountyCreator({ pageId }: { pageId: string }): Promise<IPageWithPermissions> {
  const page = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      permissions: true,
      bounty: true
    }
  });

  if (!page?.bounty) {
    throw new DataNotFoundError('This page does not have a linked bounty');
  }

  const permissionInputs: Prisma.PagePermissionCreateManyInput[] = [
    {
      pageId,
      permissionLevel: 'full_access',
      userId: page.bounty.createdBy
    },
    {
      pageId,
      permissionLevel: 'view',
      spaceId: page.bounty.spaceId
    }
  ];

  await prisma.$transaction(async (tx) => {
    const pageTree = await resolvePageTree({
      pageId,
      flattenChildren: true,
      tx
    });

    // Clear permissions
    await tx.pagePermission.deleteMany({
      where: {
        pageId: {
          in: [pageId, ...pageTree.flatChildren.map((p) => p.id)]
        }
      }
    });

    await tx.pagePermission.createMany({
      data: permissionInputs
    });

    await setupPermissionsAfterPageRepositioned(pageId, tx);
  });

  return getPage(pageId) as Promise<IPageWithPermissions>;
}
