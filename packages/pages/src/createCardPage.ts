import type { Page, Block, Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { createPage } from './createPage';
import { getPagePath } from './utils';

// import type { BoardPropertyValue } from 'lib/public-api';
type BoardPropertyValue = string | string[] | number | null | boolean | Record<string, unknown>;

export async function createCardPage(
  pageInfo: Record<keyof Pick<Page, 'title' | 'boardId' | 'createdBy' | 'spaceId'>, string> & {
    properties: Record<string, BoardPropertyValue>;
  } & Partial<Pick<Page, 'content' | 'hasContent' | 'contentText' | 'syncWithPageId' | 'createdAt'>> & {
      permissions?: Prisma.PagePermissionUncheckedCreateWithoutPageInput[];
    }
): Promise<{ page: Page; block: Block }> {
  const cardBlock = await prisma.block.create({
    data: {
      id: v4(),
      user: {
        connect: {
          id: pageInfo.createdBy
        }
      },
      createdAt: pageInfo.createdAt,
      updatedBy: pageInfo.createdBy,
      type: 'card',
      rootId: pageInfo.boardId,
      parentId: pageInfo.boardId,
      title: pageInfo.title,
      space: {
        connect: {
          id: pageInfo.spaceId
        }
      },
      schema: 1,
      fields: {
        contentOrder: [],
        headerImage: null,
        icon: '',
        isTemplate: false,
        properties: (pageInfo.properties ?? {}) as any
      }
    }
  });

  const cardPage = await createPage({
    data: {
      author: {
        connect: {
          id: cardBlock.createdBy
        }
      },
      createdAt: cardBlock.createdAt,
      updatedBy: cardBlock.updatedBy,
      updatedAt: cardBlock.updatedAt,
      card: {
        connect: {
          id: cardBlock.id
        }
      },
      content: pageInfo.content || undefined,
      hasContent: !!pageInfo.hasContent,
      contentText: pageInfo.contentText || '',
      path: getPagePath(),
      type: 'card',
      title: pageInfo.title || '',
      parent: {
        connect: {
          id: pageInfo.boardId
        }
      },
      id: cardBlock.id,
      space: {
        connect: {
          id: pageInfo.spaceId
        }
      },
      syncWithPageId: pageInfo.syncWithPageId,
      permissions: {
        create: pageInfo.permissions ?? [
          {
            permissionLevel: 'full_access',
            spaceId: pageInfo.spaceId
          }
        ]
      }
    }
  });

  return { page: cardPage, block: cardBlock };
}
