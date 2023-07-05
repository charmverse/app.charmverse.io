import type { Page as PrismaPage, Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';

import type { CardPage, PageProperty, CardPageQuery, PaginatedQuery, PaginatedResponse } from 'lib/public-api';
import { DatabasePageNotFoundError, PageFromBlock, validatePageQuery, validatePaginationQuery } from 'lib/public-api';
import { getDatabaseWithSchema } from 'lib/public-api/getDatabaseWithSchema';
import { apiHandler } from 'lib/public-api/handler';
import { mapPropertiesFromApiToSystem } from 'lib/public-api/mapPropertiesFromApiToSystemFormat';

const handler = apiHandler();

handler.post(searchDatabase);

/**
 * @swagger
 * /databases/{databaseId}/search:
 *   post:
 *     summary: Search cards in a database
 *     description: Get the available field names from the schema in the board. You can then query using its values.<br/><br/>The example properties below are only for illustrative purposes.<br/><br/>You can return up to 100 records per query
 *     tags:
 *      - 'Space API'
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                $ref: '#/components/schemas/PaginatedCardPageQuery'
 *
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  hasNext:
 *                    type: boolean
 *                    example: true
 *                  cursor:
 *                    type: string
 *                    example: bb6b7e20-680a-4202-8e2a-49570aba02fa
 *                  data:
 *                    type: array
 *                    items:
 *                      $ref: '#/components/schemas/Page'
 */
async function searchDatabase(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const spaceId = req.authorizedSpaceId;

  const boardSchema = await getDatabaseWithSchema({
    databaseId: id as string,
    spaceId
  });
  const searchQuery = req.body as PaginatedQuery<CardPageQuery>;

  validatePaginationQuery(searchQuery);

  validatePageQuery(searchQuery.query);
  const cardProperties = searchQuery.query?.properties ?? {};

  const nestedJsonQuery: Prisma.NestedJsonFilter[] = [];

  const queryProperties = await mapPropertiesFromApiToSystem({
    properties: cardProperties,
    databaseIdOrSchema: boardSchema.schema
  });

  Object.entries(queryProperties).forEach((queryItem) => {
    if (queryItem[1]) {
      nestedJsonQuery.push({
        path: ['properties', queryItem[0]],
        equals: queryItem[1] as any
      });
    }
  });

  const prismaQueryContent: Prisma.BlockWhereInput = {
    rootId: id as string,
    type: 'card',
    AND: nestedJsonQuery.map((nestedJson) => {
      return {
        fields: nestedJson
      };
    })
  };

  if (searchQuery.query?.title) {
    prismaQueryContent.page = {
      title: {
        contains: searchQuery.query.title,
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

  if (searchQuery.cursor) {
    prismaQueryWithCursor.cursor = { id: searchQuery.cursor };
    prismaQueryWithCursor.skip = 1;
  }

  if (searchQuery.limit) {
    prismaQueryWithCursor.take = Math.min(maxRecordsPerQuery, searchQuery.limit);
  } else {
    prismaQueryWithCursor.take = maxRecordsPerQuery;
  }

  const cardBlocks = await prisma.block.findMany(prismaQueryWithCursor);

  // Object that holds the page content for each card
  const cardPagesRecord: Record<string, PrismaPage> = {};

  const cardPages = await prisma.page.findMany({
    where: {
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

  const cardsWithContent = cardBlocks.map((cardBlock) => new PageFromBlock(cardBlock, boardSchema.schema));

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

  return res.status(200).send(paginatedResponse);
}
export default handler;
