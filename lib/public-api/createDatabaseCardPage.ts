import { Page } from '@prisma/client';
import { v4 } from 'uuid';
import { prisma } from 'db';
import { PageFromBlock } from './pageFromBlock.class';
import { validateCreationData } from './validateBody';
import { PageProperty } from './interfaces';

export async function createDatabase (boardInfo: Record<keyof Pick<Page, 'title' | 'createdBy' | 'spaceId'>, string>): Promise<Page> {

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
      fields: { icon: '', isTemplate: false, description: '', headerImage: null, cardProperties: [{ id: '87b42bed-1dbe-4491-9b6e-fc4c45caa81e', name: 'Status', type: 'select', options: [{ id: '7154c7b1-9370-4177-8d32-5aec591b158b', color: 'propColorGreen', value: 'Completed' }, { id: '629f8134-058a-4998-9733-042d9e75f2b0', color: 'propColorYellow', value: 'In progress' }, { id: '62f3d1a5-68bc-4c4f-ac99-7cd8f6ceb6ea', color: 'propColorRed', value: 'Not started' }] }], showDescription: false, columnCalculations: [] }
    }
  });

  return database;
}

export async function createDatabaseCardPage (pageInfo: Record<keyof Pick<Page, 'title' | 'boardId' | 'createdBy' | 'spaceId'>, string> & {properties: Record<string, string>}): Promise<PageFromBlock> {

  const pageId = v4();

  const board = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: pageInfo.boardId as string,
      spaceId: pageInfo.spaceId
    }
  });

  if (!board) {
    throw {
      error: 'Database not found'
    };
  }

  const boardSchema = (board.fields as any).cardProperties as PageProperty [];

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
        properties: pageInfo.properties
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
