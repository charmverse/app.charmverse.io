
import { Block, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { getSpaceFromApiKey, onError, onNoMatch, requireApiKey } from 'lib/middleware';
import { filterObjectKeys } from 'lib/utilities/objects';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { CardFromBlock } from 'pages/api/v1/databases/card.class';
import { validate } from 'uuid';
import { BoardPage, CardProperty, CardQuery } from '../interfaces';
import { mapProperties } from './mapProperties';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireApiKey)
  .get(getDatabase)
  .post(searchDatabase);

/**
 * @swagger
 * /databases/{databaseId}:
 *   get:
 *     summary: Find database by ID
 *     description: Use the ID of the board, or its path ie. 'getting-started'. <br /> <br />  The board object contains the schema for the custom properties assigned to cards.
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/BoardPage'
 */
async function getDatabase (req: NextApiRequest, res: NextApiResponse) {

  const { id } = req.query;

  const space = await getSpaceFromApiKey(req);

  const isValidUuid = validate(id as string);

  console.log('Is valid UUID', isValidUuid);

  // eslint-disable-next-line prefer-const
  let [database, board] = await Promise.all([
    prisma.page.findFirst({
      where: isValidUuid ? {
        type: 'board',
        boardId: id as string,
        spaceId: space.id
      } : {
        type: 'board',
        path: id as string,
        spaceId: space.id
      }

    }),
    isValidUuid ? prisma.block.findFirst({
      where: {
        type: 'board',
        id: id as string
      }
    }) : null
  ]);

  if (!isValidUuid && database && database.boardId) {
    board = await prisma.block.findFirst({
      where: {
        type: 'board',
        id: database.boardId as string
      }
    }) as any as Block;
  }

  console.log('Database', database, 'board', board);

  if (!database || !board) {
    return res.status(404).send({ error: 'Database not found' });
  }

  const filteredDatabaseObject = filterObjectKeys(database as any as BoardPage, 'include', ['id', 'createdAt', 'type', 'title', 'content', 'url']);

  const domain = process.env.DOMAIN;

  filteredDatabaseObject.url = `${domain}/${space.domain}/${database.path}`;

  console.log('BOARD', board);

  (filteredDatabaseObject as any).schema = (board as any).fields.cardProperties;
  filteredDatabaseObject.id = board.id;
  filteredDatabaseObject.content = '';

  return res.status(200).json(filteredDatabaseObject);
}

/**
 * @swagger
 * /databases/{databaseId}:
 *   post:
 *     summary: Search tasks in database
 *     description: Get the available field names from the schema in the board. You can then query using its values.<br/><br/>The below example properties are only for illustrative purposes.
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                type: object
 *                $ref: '#/components/schemas/CardQuery'
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Card'
 */
async function searchDatabase (req: NextApiRequest, res: NextApiResponse) {

  const searchQuery = req.body as CardQuery;

  const { id } = req.query;

  const board = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: id as string
    }
  });

  if (!board) {
    return res.status(404).send({ error: 'Board not found' });
  }

  if (!searchQuery.cardProperties || typeof searchQuery.cardProperties !== 'object' || searchQuery.cardProperties instanceof Array) {
    return res.status(400).send({
      error: 'Request body should contain a cardProperties object'
    });
  }

  const nestedJsonQuery: Prisma.NestedJsonFilter [] = [];

  const boardSchema = (board.fields as any).cardProperties as CardProperty[];

  try {
    const queryProperties: Record<string, string | number> = mapProperties(searchQuery.cardProperties, boardSchema);

    Object.entries(queryProperties).forEach(queryItem => {
      nestedJsonQuery.push({
        path: ['properties', queryItem[0]],
        equals: queryItem[1]
      });
    });

  }
  catch (error) {
    return res.status(400).send(error);
  }

  const cards = (await prisma.block.findMany({
    where: {
      rootId: id as string,
      type: 'card',
      AND: nestedJsonQuery.map(nestedJson => {
        return {
          fields: nestedJson
        };
      })
    }
  }));

  const cardsPageContent = await prisma.block.findMany({
    where: {
      OR: cards.map(card => {
        return {
          parentId: card.id,
          type: 'charm_text'
        };
      })
    }
  });

  const cardsWithContent = cards.map(card => {
    const cardPageData = cardsPageContent.find(page => page.parentId === card.id);

    return new CardFromBlock(card, boardSchema, (cardPageData?.fields as any)?.content);

  });

  console.log('Found cards', cards.length);

  return res.status(200).send(cardsWithContent);

}
export default handler;
