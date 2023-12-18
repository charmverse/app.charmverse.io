import type { PageWithPermissions } from '@charmverse/core/pages';
import type { Prisma, Page } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { createPage as createPageDb } from 'lib/pages/server/createPage';
import { getPagePath } from 'lib/pages/utils';

export function createPage(
  options: Partial<Page> &
    Pick<Page, 'spaceId' | 'createdBy'> & { pagePermissions?: Prisma.PagePermissionCreateManyPageInput[] }
): Promise<PageWithPermissions> {
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
  }) as Promise<PageWithPermissions>;
}

// Utility function to help with debugging visible vs invisible pages
export async function compareMissingExpectedPages({
  expected,
  received
}: {
  expected: string[];
  received: string[];
}): Promise<void> {
  // eslint-disable-next-line no-console
  console.log({ expected, received });

  // Fetch all pages that are either expected or received
  const allPages = await prisma.page.findMany({
    where: {
      id: {
        in: [...new Set([...expected, ...received])]
      }
    },
    select: {
      id: true,
      title: true
    }
  });

  // Map the fetched pages for easy lookup
  const pageMap = new Map(allPages.map((page) => [page.id, page]));

  // Identify missing pages (expected but not received)
  const missingPages = expected
    .filter((pageId) => !received.includes(pageId))
    .map((missingPageId) => ({ id: missingPageId, title: pageMap.get(missingPageId)?.title ?? 'Page not found' }));

  // eslint-disable-next-line no-console
  console.log('MISSING PAGES', missingPages);

  // Identify unexpected pages (received but not expected)
  const unexpectedPages = received
    .filter((pageId) => !expected.includes(pageId))
    .map((unexpectedPageId) => pageMap.get(unexpectedPageId));

  // eslint-disable-next-line no-console
  console.log('UNEXPECTED PAGES', unexpectedPages);
}
