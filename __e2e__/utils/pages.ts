import { prisma } from '@charmverse/core';
import type { Prisma, Page } from '@charmverse/core/dist/prisma';
import { v4 } from 'uuid';

import type { IPageWithPermissions } from 'lib/pages/interfaces';
import { getPagePath } from 'lib/pages/utils';

export function generatePage(
  options: Partial<Page> &
    Pick<Page, 'spaceId' | 'createdBy'> & { pagePermissions?: Prisma.PagePermissionCreateManyPageInput[] }
): Promise<IPageWithPermissions> {
  return prisma.page.create({
    data: {
      id: options.id ?? v4(),
      content: options.content as Prisma.InputJsonValue,
      contentText: options.contentText ?? '',
      path: options.path ?? getPagePath(),
      title: options.title || 'Example',
      type: options.type ?? 'page',
      updatedBy: options.createdBy,
      author: {
        connect: {
          id: options.createdBy
        }
      },
      space: {
        connect: {
          id: options.spaceId
        }
      },
      permissions: options.pagePermissions
        ? {
            createMany: {
              data: options.pagePermissions || [{ spaceId: options.spaceId, permissionLevel: 'full_access' }]
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

export function generatePageWithLinkedPage(
  options: Partial<Page> &
    Pick<Page, 'spaceId' | 'createdBy'> &
    Partial<Omit<Page, 'content'>> & {
      pagePermissions?: Prisma.PagePermissionCreateManyPageInput[];
      linkedPageId: string;
    }
) {
  const content = { type: 'doc', content: [{ type: 'page', attrs: { id: options.linkedPageId, track: [] } }] };

  return generatePage({ ...options, content });
}
