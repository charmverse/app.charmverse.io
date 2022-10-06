import type { PagePermission, PagePermissionLevel } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import type { IPageWithPermissions } from 'lib/pages';
import { getPage, resolvePageTree } from 'lib/pages/server';
import { DataNotFoundError } from 'lib/utilities/errors';

import { upsertPermission } from '../actions';

import { setupPermissionsAfterPageRepositioned } from './page-repositioned';

export async function lockToBountyCreator ({ pageId }: { pageId: string }): Promise<IPageWithPermissions> {
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

  const toModify: PagePermission[] = [...page.permissions.filter(p => p.userId !== page.bounty?.createdBy).map(p => {
    return {
      ...p,
      permissionLevel: 'view' as PagePermissionLevel
    };
  }), { id: v4(), inheritedFromPermission: null, pageId, permissionLevel: 'full_access', public: null, roleId: null, permissions: [], spaceId: null, userId: page.bounty?.createdBy }];

  await prisma.$transaction(async (tx) => {

    const pageTree = await resolvePageTree({
      pageId,
      flattenChildren: true,
      tx
    });

    for (const permission of toModify) {
      await upsertPermission(pageId, permission, pageTree, tx);
    }
    await setupPermissionsAfterPageRepositioned(pageId, tx);
  });

  return getPage(pageId) as Promise<IPageWithPermissions>;

}
