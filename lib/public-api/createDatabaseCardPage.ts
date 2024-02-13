import { log } from '@charmverse/core/log';
import type { Page } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import { prismaToBlock } from 'lib/focalboard/block';
import { createPage } from 'lib/pages/server/createPage';
import { getPagePath } from 'lib/pages/utils';
import { emptyDocument } from 'lib/prosemirror/constants';
import { getMarkdownText } from 'lib/prosemirror/getMarkdownText';
import { parseMarkdown } from 'lib/prosemirror/markdown/parseMarkdown';
import { InvalidInputError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';

import { getDatabaseWithSchema } from './getDatabaseWithSchema';
import { handleMappedPropertyEdgeCases } from './handleMappedPropertyEdgeCases';
import type { BoardPropertyValue } from './interfaces';
import { mapPropertiesFromApiToSystem } from './mapPropertiesFromApiToSystemFormat';
import { PageFromBlock } from './pageFromBlock.class';

type CreateDatabaseInput = Record<keyof Pick<Page, 'boardId' | 'createdBy' | 'spaceId'>, string> & {
  properties?: Record<string, BoardPropertyValue>;
} & Partial<Pick<Page, 'title' | 'content' | 'hasContent' | 'contentText' | 'syncWithPageId'>> & {
    contentMarkdown?: string;
  };

export async function createDatabaseCardPage({
  boardId,
  createdBy,
  properties,
  spaceId,
  title,
  content,
  contentMarkdown,
  contentText,
  hasContent,
  syncWithPageId
}: CreateDatabaseInput): Promise<PageFromBlock> {
  const databaseWithSchema = await getDatabaseWithSchema({
    databaseId: boardId,
    spaceId
  });

  const mappedProperties = await mapPropertiesFromApiToSystem({
    properties: properties ?? {},
    databaseIdOrSchema: databaseWithSchema.schema
  });

  const validatedProperties = handleMappedPropertyEdgeCases({
    mapped: mappedProperties,
    schema: databaseWithSchema.schema
  });

  let contentToInsert: any = content;

  if (contentMarkdown) {
    try {
      const parsedContent = parseMarkdown(contentMarkdown);
      contentToInsert = parsedContent;
    } catch (err) {
      log.error(`Failed to parse markdown while creating page for board`, { boardId: databaseWithSchema.id, spaceId });
      throw new InvalidInputError(`Failed to parse the provided markdown`);
    }
  }

  const createdCard = await prisma.$transaction(async (tx) => {
    const pageId = uuid();

    const pageTitle = title ?? 'Untitled';

    const cardBlock = await tx.block.create({
      data: {
        id: pageId,
        user: {
          connect: {
            id: createdBy
          }
        },
        updatedBy: createdBy,
        type: 'card',
        rootId: databaseWithSchema.id,
        parentId: databaseWithSchema.id,
        title: pageTitle,
        space: {
          connect: {
            id: spaceId
          }
        },
        schema: 1,
        fields: {
          contentOrder: [],
          headerImage: null,
          icon: '',
          isTemplate: false,
          properties: validatedProperties as any
        }
      }
    });
    const page = await createPage({
      tx,
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
        content: contentToInsert || emptyDocument,
        hasContent: !!hasContent,
        contentText: contentText || '',
        path: getPagePath(),
        type: 'card',
        title: pageTitle,
        parentId: databaseWithSchema.id,
        id: cardBlock.id,
        space: {
          connect: {
            id: spaceId
          }
        },
        syncWithPageId
      }
    });

    return { cardBlock, page };
  });

  relay.broadcast(
    {
      type: 'blocks_created',
      payload: [prismaToBlock(createdCard.cardBlock)]
    },
    createdCard.cardBlock.spaceId
  );

  relay.broadcast(
    {
      type: 'pages_created',
      payload: [createdCard.page]
    },
    createdCard.page.spaceId
  );

  const card = new PageFromBlock(
    { ...createdCard.cardBlock, title: createdCard.page.title },
    databaseWithSchema.schema
  );

  if (contentMarkdown) {
    card.content.markdown = await getMarkdownText(createdCard.page.content);
  }

  return card;
}
