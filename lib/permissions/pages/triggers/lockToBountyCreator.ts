import { prisma } from '@charmverse/core';
import type { Prisma } from '@charmverse/core/dist/prisma';
import { v4 } from 'uuid';

import type { IPageWithPermissions } from 'lib/pages';
import { getPage, resolvePageTree } from 'lib/pages/server';
import { DataNotFoundError } from 'lib/utilities/errors';

import { pagePermissionGrantsEditAccess } from '../pagePermissionGrantsEditAccess';

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
  const permissionsToCreate: Prisma.PagePermissionCreateManyInput[] = page.permissions.map((p) => {
    if (p.userId === page.bounty!.createdBy) {
      p.permissionLevel = 'full_access';
    } else if (pagePermissionGrantsEditAccess(p)) {
      p.permissionLevel = 'view';
    }
    p.id = v4();
    return p;
  });

  if (!permissionsToCreate.some((p) => p.userId === page.bounty!.createdBy)) {
    permissionsToCreate.push({
      pageId,
      permissionLevel: 'full_access',
      userId: page.bounty!.createdBy
    });
  }
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
      data: permissionsToCreate
    });

    const inheritedPermissions = pageTree.flatChildren
      .map((child) =>
        permissionsToCreate.slice().map((p) => {
          p.pageId = child.id;
          p.inheritedFromPermission = p.id;
          p.id = v4();
          return p;
        })
      )
      .flat();

    await tx.pagePermission.createMany({
      data: inheritedPermissions
    });
  });

  return getPage(pageId) as Promise<IPageWithPermissions>;
}
