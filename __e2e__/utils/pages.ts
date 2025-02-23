import type { PageWithPermissions } from '@charmverse/core/pages';
import type { Prisma, Page } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getPagePath } from '@packages/pages/utils';
import { v4 } from 'uuid';

import { generateFirstDiff } from 'lib/pages/server/generateFirstDiff';

export function generatePage(
  options: Partial<Page> &
    Pick<Page, 'spaceId' | 'createdBy'> & { pagePermissions?: Prisma.PagePermissionCreateManyPageInput[] }
): Promise<PageWithPermissions> {
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
      parent: options.parentId
        ? {
            connect: {
              id: options.parentId
            }
          }
        : undefined,
      space: {
        connect: {
          id: options.spaceId
        }
      },
      permissions: {
        createMany: {
          data: options.pagePermissions || [{ spaceId: options.spaceId, permissionLevel: 'full_access' }]
        }
      },
      deletedAt: options.deletedAt ?? null,
      boardId: options.boardId ?? null,
      diffs: options.content
        ? {
            create: generateFirstDiff({
              createdBy: options.createdBy,
              content: options.content
            })
          }
        : undefined
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  }) as Promise<PageWithPermissions>;
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
