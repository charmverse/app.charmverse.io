
import { Block } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireApiKey, getSpaceFromApiKey } from 'lib/middleware';
import { filterObjectKeys } from 'lib/utilities/objects';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { validate } from 'uuid';
import { BoardPage, CardProperty } from '../interfaces';

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
 *     description: Get the available field names from the schema in the board. You can then query using its values.<br/><br/>The below example properties are only for illustrative purposes.
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                type: object
 *                properties:
 *                  Status:
 *                    type: string
 *                    required: false
 *                    example: Complete
 *                  Person:
 *                    type: string
 *                    example: 4ea4d01a-2dee-415a-92b7-09ac648f6d06
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Card'
 */
async function searchDatabase (req: NextApiRequest, res: NextApiResponse) {

  const searchQuery = req.body;

  const { id } = searchQuery;

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

  const boardSchema: CardProperty[] = (board?.fields as any)?.cardProperties ?? [];

  const applicableProperties = Object.keys(searchQuery).map(key => {
    return boardSchema.find(property => property.name === key);
  })
    .filter(property => property !== undefined) as CardProperty [];

  let cardsToReturn = cards.slice();

  if (applicableProperties.length > 0) {
    cardsToReturn = cardsToReturn.filter(card => {
      for (const cardProperty of applicableProperties) {

        let searchValue = searchQuery[cardProperty?.name];

        if (cardProperty.type === 'select' || cardProperty.type === 'multiSelect') {
          searchValue = cardProperty.options?.find(option => option.value === searchValue)?.id;
        }

        // Focalboard stores select values with a uuid for the corresponding option

        if ((card.fields as any).properties[cardProperty.id] !== searchValue) {
          return false;
        }
      }
      return true;
    });

  }

  console.log('Returned', cardsToReturn.length);

  return res.status(200).send(cardsToReturn);

}

export default handler;
