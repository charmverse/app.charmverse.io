import { prisma } from '@charmverse/core/prisma-client';
import { pageTree, resolvePageTree } from '@packages/core/pages';
import type { PermissionResource } from '@packages/core/permissions';

import { PagePermissionNotFoundError } from './errors';

export async function deletePagePermission({ permissionId }: PermissionResource): Promise<void> {
  if (!permissionId) {
    throw {
      error: 'Please provide a valid permission ID'
    };
  }

  const foundPermission = await prisma.pagePermission.findUnique({
    where: {
      id: permissionId
    }
  });

  if (!foundPermission) {
    throw new PagePermissionNotFoundError(permissionId);
  }

  // We are deleting an intermediate permission, so we need to also delete all children
  if (foundPermission.inheritedFromPermission) {
    const { targetPage } = await resolvePageTree({ pageId: foundPermission.pageId });
    const childPages = pageTree.flattenTree(targetPage);
    // Delete all child permissions that inherited from the same permission as this
    await prisma.pagePermission.deleteMany({
      where: {
        AND: [
          // Permission linked to this page or the children
          {
            OR: [
              {
                pageId: foundPermission.pageId
              },
              ...childPages.map((page) => {
                return {
                  pageId: page.id
                };
              })
            ]
          },
          // Permission itself or child page permissions that inherit from same page as this
          {
            OR: [
              {
                id: permissionId
              },
              {
                inheritedFromPermission: foundPermission.inheritedFromPermission
              }
            ]
          }
        ]
      }
    });
  } else {
    // Delete the permission and the permissions as this permission is the root authority
    await prisma.pagePermission.deleteMany({
      where: {
        OR: [
          {
            id: permissionId
          },
          {
            inheritedFromPermission: permissionId
          }
        ]
      }
    });
  }
}
