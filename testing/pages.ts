import type { Prisma, Page } from '@charmverse/core/dist/prisma';
import { v4 } from 'uuid';

import type { IPageWithPermissions } from 'lib/pages/interfaces';
import { createPage as createPageDb } from 'lib/pages/server/createPage';
import { getPagePath } from 'lib/pages/utils';

export function createPage(
  options: Partial<Page> &
    Pick<Page, 'spaceId' | 'createdBy'> & { pagePermissions?: Prisma.PagePermissionCreateManyPageInput[] }
): Promise<IPageWithPermissions> {
  return createPageDb({
    data: {
      id: options.id ?? v4(),
      contentText: options.contentText ?? '',
      path: options.path ?? getPagePath(),
      title: options.title || 'Example',
      type: options.type ?? 'page',
      updatedBy: options.createdBy,
      content: options.content as Prisma.InputJsonObject,
      author: {
        connect: {
          id: options.createdBy
        }
      },
      space: {
        connect: {
          id: options.spaceId as string
        }
      },
      permissions: options.pagePermissions
        ? {
            createMany: {
              data: options.pagePermissions
            }
          }
        : undefined,
      parentId: options.parentId,
      deletedAt: options.deletedAt ?? null,
      boardId: options.boardId ?? null
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  }) as Promise<IPageWithPermissions>;
}
