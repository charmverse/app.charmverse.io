import { DataNotFoundError } from '@charmverse/core/errors';
import type { Page, Block } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { createPage } from 'lib/pages/server/createPage';
import { getPagePath } from 'lib/pages/utils';
import type { BoardPropertyValue } from 'lib/public-api';

export async function createCardPage(
  pageInfo: Record<keyof Pick<Page, 'title' | 'boardId' | 'createdBy' | 'spaceId'>, string> & {
    properties: Record<string, BoardPropertyValue>;
  } & Partial<Pick<Page, 'content' | 'hasContent' | 'contentText' | 'syncWithPageId' | 'createdAt'>>
): Promise<{ page: Page; block: Block }> {
  const board = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: pageInfo.boardId as string,
      spaceId: pageInfo.spaceId
    }
  });

  if (!board) {
    throw new DataNotFoundError('Database was not found');
  }

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
      content: pageInfo.content || { type: 'doc', content: [] },
      hasContent: !!pageInfo.hasContent,
      contentText: pageInfo.contentText || '',
      path: getPagePath(),
      type: 'card',
      title: pageInfo.title || '',
      parentId: pageInfo.boardId,
      id: cardBlock.id,
      space: {
        connect: {
          id: pageInfo.spaceId
        }
      },
      syncWithPageId: pageInfo.syncWithPageId,
      permissions: {
        create: [
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
