import type { Page } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4, validate } from 'uuid';

import { prismaToBlock } from 'lib/focalboard/block';
import { createPage } from 'lib/pages/server/createPage';
import { getPagePath } from 'lib/pages/utils';
import { InvalidInputError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';

import { DatabasePageNotFoundError } from './errors';
import type { BoardPropertyValue, PageProperty } from './interfaces';
import { mapPropertiesToSystemFormat } from './mapPropertiesToSystemFormat';
import { PageFromBlock } from './pageFromBlock.class';

type CreateDatabaseInput = {
  pageInfo: Record<keyof Pick<Page, 'title' | 'boardId' | 'createdBy' | 'spaceId'>, string> & {
    properties: Record<string, BoardPropertyValue>;
  } & Partial<Pick<Page, 'content' | 'hasContent' | 'contentText' | 'syncWithPageId'>> & { contentMarkdown?: string };
};

export async function createDatabaseCardPage({ pageInfo }: CreateDatabaseInput): Promise<PageFromBlock> {
  const isValidUUid = validate(pageInfo.boardId);

  const domain = process.env.DOMAIN ?? 'https://app.charmverse.io';

  if (!isValidUUid) {
    throw new InvalidInputError(
      `Please provide a valid database ID in the request query. Visit ${domain}/api-docs to find out how to get this`
    );
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

  const boardSchema = (board.fields as any).cardProperties as PageProperty[];

  const mappedProperties = mapPropertiesToSystemFormat(pageInfo.properties ?? {}, boardSchema);

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
        properties: mappedProperties as any
      }
    }
  });

  const page = await createPage({
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
      syncWithPageId: pageInfo.syncWithPageId
    }
  });

  relay.broadcast(
    {
      type: 'blocks_created',
      payload: [prismaToBlock(cardBlock)]
    },
    cardBlock.spaceId
  );

  relay.broadcast(
    {
      type: 'pages_created',
      payload: [page]
    },
    page.spaceId
  );

  const card = new PageFromBlock(cardBlock, boardSchema);

  return card;
}
