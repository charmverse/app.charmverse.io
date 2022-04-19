import { Page } from '@prisma/client';
import { prisma } from 'db';
import { v4, validate } from 'uuid';
import { DatabasePageNotFoundError, InvalidInputError } from './errors';
import { PageProperty } from './interfaces';
import { PageFromBlock } from './pageFromBlock.class';
import { validateCreationData } from './validateBody';

export async function createDatabase (boardInfo: Record<keyof Pick<Page, 'title' | 'createdBy' | 'spaceId'>, string>, boardSchema: PageProperty [] = []): Promise<Page> {

  const boardId = v4();

  const database = await prisma.page.create({
    data: {
      title: 'Example title',
      path: 'demo-path',
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

  const board = await prisma.block.create({
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

export async function createDatabaseCardPage (pageInfo: Record<keyof Pick<Page, 'title' | 'boardId' | 'createdBy' | 'spaceId'>, string> & {properties: Record<string, string>}): Promise<PageFromBlock> {

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

  const pageId = v4();

  const block = await prisma.block.create({
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
        contentOrder: [
          pageId
        ],
        headerImage: null,
        icon: '',
        isTemplate: false,
        properties: pageInfo.properties ?? {}
      }

    }
  });

  const page = await prisma.block.create({
    data: {
      id: pageId,
      user: {
        connect: {
          id: pageInfo.createdBy
        }
      },
      updatedBy: pageInfo.createdBy,
      type: 'charm_text',
      rootId: pageInfo.boardId as string,
      parentId: block.id,
      title: '',
      space: {
        connect: {
          id: pageInfo.spaceId
        }
      },
      schema: 1,
      fields: {
      }

    }
  });

  const card = new PageFromBlock(block, boardSchema);

  return card;
}
