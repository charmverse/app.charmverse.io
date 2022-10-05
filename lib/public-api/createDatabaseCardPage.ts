import type { Page } from '@prisma/client';
import { v4, validate } from 'uuid';

import { prisma } from 'db';
import { createPage } from 'lib/pages/server/createPage';
import { getPagePath } from 'lib/pages/utils';
import { InvalidInputError } from 'lib/utilities/errors';

import { DatabasePageNotFoundError } from './errors';
import type { PageProperty } from './interfaces';
import { PageFromBlock } from './pageFromBlock.class';

export async function createDatabase (boardInfo: Record<keyof Pick<Page, 'title' | 'createdBy' | 'spaceId'>, string>, boardSchema: PageProperty [] = []): Promise<Page> {

  const boardId = v4();

  const database = await createPage({
    data: {
      id: boardId,
      title: 'Example title',
      path: `path-${v4()}`,
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
      fields: { icon: '', isTemplate: false, description: '', headerImage: null, cardProperties: boardSchema as any, showDescription: false, columnCalculations: [] }
    }
  });

  return database;
}

export async function createDatabaseCardPage (pageInfo: Record<keyof Pick<Page, 'title' | 'boardId' | 'createdBy' | 'spaceId'>, string> & { properties: Record<string, string> }): Promise<PageFromBlock> {

  const isValidUUid = validate(pageInfo.boardId);

  const domain = process.env.DOMAIN ?? 'https://app.charmverse.io';

  if (!isValidUUid) {
    throw new InvalidInputError(`Please provide a valid database ID in the request query. Visit ${domain}/api-docs to find out how to get this`);
  }

  const board = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: pageInfo.boardId as string,
      spaceId: pageInfo.spaceId
    }
  });

  if (!board) {
    throw new DatabasePageNotFoundError(pageInfo.boardId);
  }

  const boardSchema = (board.fields as any).cardProperties as PageProperty [];

  const cardBlock = await prisma.block.create({
    data: {
      id: v4(),
      user: {
        connect: {
          id: pageInfo.createdBy
        }
      },
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
        properties: pageInfo.properties ?? {}
      }
    }
  });

  await createPage({
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
      content: { type: 'doc', content: [] },
      hasContent: false,
      contentText: '',
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

  const card = new PageFromBlock(cardBlock, boardSchema);

  return card;
}
