import type { Page as PrismaPage, Prisma } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireApiKey } from 'lib/middleware';
import type { CardPage, PageProperty, CardPageQuery, PaginatedQuery, PaginatedResponse } from 'lib/public-api';
import {
  DatabasePageNotFoundError,
  mapProperties,
  PageFromBlock,
  validatePageQuery,
  validatePaginationQuery
} from 'lib/public-api';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireApiKey).post(searchDatabase);

// Limit the maximum size of a search query's results
const maxRecordsPerQuery = 100;

/**
 * @swagger
 * /databases/{databaseId}/search:
 *   post:
 *     summary: Search pages in database
 *     description: Get the available field names from the schema in the board. You can then query using its values.<br/><br/>The example properties below are only for illustrative purposes.<br/><br/>You can return up to 100 records per query
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                type: object
 *                properties:
 *                  limit:
 *                    type: integer
 *                    required: false
 *                    example: 10
 *                  cursor:
 *                    type: string
 *                    required: false
 *                    example: e63758e2-de17-48b2-9c74-5a40ea5be761
 *                  query:
 *                    type: object
 *                    $ref: '#/components/schemas/PageQuery'
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

  const board = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: id as string,
      // This parameter is only added to ensure requests using the current API key only return data for that space
      spaceId
    }
  });

  if (!board) {
    throw new DatabasePageNotFoundError(id as string);
  }

  const searchQuery = req.body as PaginatedQuery<CardPageQuery>;

  validatePaginationQuery(searchQuery);

  validatePageQuery(searchQuery.query);

  const boardSchema = (board.fields as any).cardProperties as PageProperty[];

  const cardProperties = searchQuery.query?.properties ?? {};

  const nestedJsonQuery: Prisma.NestedJsonFilter[] = [];

  const queryProperties: Record<string, string | number> = mapProperties(cardProperties, boardSchema);

  Object.entries(queryProperties).forEach((queryItem) => {
    nestedJsonQuery.push({
      path: ['properties', queryItem[0]],
      equals: queryItem[1]
    });
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

  const cardsWithContent = cardBlocks.map((cardBlock) => new PageFromBlock(cardBlock, boardSchema));

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
