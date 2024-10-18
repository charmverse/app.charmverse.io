import type { Page, Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { getDatabaseWithSchema } from './getDatabaseWithSchema';
import type { CardPage, PageProperty, PaginatedCardPageQuery, PaginatedResponse } from './interfaces';
import { mapPropertiesFromApiToSystem } from './mapPropertiesFromApiToSystemFormat';
import { PageFromBlock } from './pageFromBlock.class';
import { validatePageQuery, validatePaginationQuery } from './validateBody';

type DatabaseSearch = {
  databaseId: string;
  spaceId: string;
  paginatedQuery?: Partial<PaginatedCardPageQuery>;
};

// Limit the maximum size of a search query's results
const maxRecordsPerQuery = 100;

export async function searchDatabase({
  databaseId,
  paginatedQuery,
  spaceId
}: DatabaseSearch): Promise<PaginatedResponse<CardPage>> {
  // Make sure only supported API keys are present
  if (paginatedQuery) {
    validatePaginationQuery(paginatedQuery);

    if (paginatedQuery.query) {
      validatePageQuery(paginatedQuery.query);
    }
  }

  const cardProperties = paginatedQuery?.query?.properties ?? {};

  const boardSchema = await getDatabaseWithSchema({
    databaseId: databaseId as string,
    spaceId
  });

  const mappedSchemas = boardSchema.schema.reduce(
    (acc, prop) => {
      acc[prop.id] = prop;
      return acc;
    },
    {} as Record<string, PageProperty>
  );

  const nestedJsonQuery: Prisma.NestedJsonFilter[] = [];

  const queryProperties = await mapPropertiesFromApiToSystem({
    properties: cardProperties,
    databaseIdOrSchema: boardSchema.schema
  });

  Object.entries(queryProperties).forEach((queryItem) => {
    if (queryItem[1] !== undefined) {
      const schema = mappedSchemas[queryItem[0]];

      if (schema.type === 'text' || schema.type === 'phone' || schema.type === 'email' || schema.type === 'url') {
        nestedJsonQuery.push({
          path: ['properties', queryItem[0]],
          // PostgreSQL does not suport case-insensitive search for string_contains on nested JSON
          // https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#remarks-34
          string_contains: queryItem[1] as any
        });
      } else if (schema.type === 'date') {
        nestedJsonQuery.push({
          path: ['properties', queryItem[0]],
          string_contains: queryItem[1] as any
        });
      } else if (schema.type === 'multiSelect' || schema.type === 'person') {
        nestedJsonQuery.push({
          path: ['properties', queryItem[0]],
          array_contains: queryItem[1] as any
        });
      } else if (schema.type === 'checkbox') {
        if (queryItem[1] === 'true') {
          nestedJsonQuery.push({
            path: ['properties', queryItem[0]],
            equals: 'true'
          });
        } else {
          nestedJsonQuery.push({
            path: ['properties', queryItem[0]],
            not: 'true'
          });
        }
      } else {
        nestedJsonQuery.push({
          path: ['properties', queryItem[0]],
          equals: queryItem[1] as any
        });
      }
    }
  });

  const prismaQueryContent: Prisma.BlockWhereInput = {
    rootId: boardSchema.id,
    type: 'card',
    deletedAt: null,
    AND: nestedJsonQuery.map((nestedJson) => {
      return {
        fields: nestedJson
      };
    })
  };

  if (paginatedQuery?.query?.title) {
    prismaQueryContent.page = {
      title: {
        contains: paginatedQuery.query.title,
        mode: 'insensitive'
      }
    };
  }

  const prismaQueryWithCursor: Prisma.BlockFindManyArgs = {
    where: prismaQueryContent,
    orderBy: {
      id: 'asc'
    }
  };

  if (paginatedQuery?.cursor) {
    prismaQueryWithCursor.cursor = { id: paginatedQuery.cursor };
    prismaQueryWithCursor.skip = 1;
  }

  if (paginatedQuery?.limit) {
    prismaQueryWithCursor.take = Math.min(maxRecordsPerQuery, paginatedQuery.limit);
  } else {
    prismaQueryWithCursor.take = maxRecordsPerQuery;
  }

  const cardBlocks = await prisma.block.findMany(prismaQueryWithCursor);

  // Object that holds the page content for each card
  const cardPagesRecord: Record<string, Page> = {};

  const cardPages = await prisma.page.findMany({
    where: {
      deletedAt: null,
      OR: cardBlocks.map((cardBlock) => {
        return {
          id: cardBlock.id
        };
      })
    }
  });

  cardPages.forEach((cardPage) => {
    cardPagesRecord[cardPage.id] = cardPage;
  });

  const cardsWithContent = cardBlocks.map(
    (cardBlock) => new PageFromBlock({ ...cardBlock, title: cardPagesRecord[cardBlock.id]?.title }, boardSchema.schema)
  );

  let hasNext = false;
  let cursor: string | undefined;

  if (cardBlocks.length > 0) {
    const lastPageId = cardBlocks[cardBlocks.length - 1].id;
    const remainingRecords = await prisma.block.count({
      cursor: {
        id: lastPageId
      },
      skip: 1,
      where: prismaQueryContent,
      orderBy: {
        id: 'asc'
      }
    });

    if (remainingRecords > 0) {
      hasNext = true;
      cursor = lastPageId;
    }
  }

  const paginatedResponse: PaginatedResponse<CardPage> = {
    hasNext,
    cursor,
    data: cardsWithContent
  };

  return paginatedResponse;
}
