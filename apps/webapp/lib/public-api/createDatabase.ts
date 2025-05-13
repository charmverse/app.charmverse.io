import type { Page } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { createPage } from '@packages/pages/createPage';
import { v4 } from 'uuid';

import { getPagePath } from 'lib/pages';

import type { PageProperty } from './interfaces';

// This method is not used in production code, we should move it to testing utilities
// Keeping here for now in case we want to offer this as an API endpoint
export async function createDatabase(
  boardInfo: Record<keyof Pick<Page, 'title' | 'createdBy' | 'spaceId'>, string>,
  boardSchema: PageProperty[] = []
): Promise<Page> {
  const boardId = v4();

  const database = await createPage({
    data: {
      id: boardId,
      title: 'Example title',
      path: getPagePath(),
      type: 'board',
      contentText: '',
      boardId,
      space: {
        connect: {
          id: boardInfo.spaceId
        }
      },
      author: {
        connect: {
          id: boardInfo.createdBy
        }
      },
      updatedBy: boardInfo.createdBy
    }
  });

  await prisma.block.create({
    data: {
      id: boardId,
      user: {
        connect: {
          id: boardInfo.createdBy
        }
      },
      updatedBy: boardInfo.createdBy,
      type: 'board',
      parentId: '',
      rootId: boardId,
      title: boardInfo.title,
      space: {
        connect: {
          id: boardInfo.spaceId
        }
      },
      schema: 1,
      fields: {
        icon: '',
        isTemplate: false,
        description: '',
        headerImage: null,
        cardProperties: boardSchema as any,
        showDescription: false,
        columnCalculations: []
      }
    }
  });

  return database;
}
