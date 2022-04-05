
import { Block } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireApiKey, getSpaceFromApiKey } from 'lib/middleware';
import { filterObjectKeys } from 'lib/utilities/objects';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { validate } from 'uuid';
import { BoardPage } from '../interfaces';

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
    return res.status(400).send({ error: 'Database not found' });
  }

  const filteredDatabaseObject = filterObjectKeys(database as any as BoardPage, 'include', ['id', 'createdAt', 'type', 'title', 'content', 'url']);

  const domain = process.env.DOMAIN;

  filteredDatabaseObject.url = `${domain}/${space.domain}/${database.path}`;

  console.log('BOARD', board);

  (filteredDatabaseObject as any).schema = (board as any).fields.cardProperties;

  return res.status(200).json(filteredDatabaseObject);
}

/**
 * @swagger
 * /databases/{databaseId}:
 *   post:
 *     summary: Search tasks in database
 *     description: To use your custom attributes, get the ID of each field property from the database endpoint and append it to filter ie. 'filter.abce33e-222e=abbbsjs-223783&filter.a772eb67f-222e=abbbeac89a-223783'
 *     parameters:
 *     - in: query
 *       name: filter.xxx
 *       schema:
 *         type: string
 *       required: false
 *     - in: query
 *       name: filter.yyy
 *       schema:
 *         type: string
 *       required: false
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Card'
 */
async function searchDatabase (req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const [board, cards] = await Promise.all([
    prisma.block.findFirst({
      where: {
        type: 'board',
        id: id as string
      }
    }),
    prisma.block.findMany({
      where: {
        rootId: id as string,
        type: 'card'
      }
    })
  ]);

  const boardSchema: any[] = (board?.fields as any)?.cardProperties ?? [];

  const applicableFilters = Object.keys(req.query).filter(key => {
    return key.match('filter.') !== null;
  })
    .map(filter => filter.replace('filter.', '').trim())
    .filter(filterKey => {
      return boardSchema.find(property => property.id === filterKey);
    });

  let cardsToReturn = cards.slice();

  console.log('Found cards', cardsToReturn.length);

  if (applicableFilters.length > 0) {
    cardsToReturn = cardsToReturn.filter(card => {
      for (const filterKey of applicableFilters) {
        const searchValue = req.query[`filter.${filterKey}`];
        if ((card.fields as any).properties[filterKey] !== searchValue) {
          return false;
        }
      }
      return true;
    });

  }

  return res.status(200).send(cardsToReturn);

}

export default handler;
