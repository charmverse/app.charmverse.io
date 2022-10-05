
import type { Block } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { validate } from 'uuid';

import { prisma } from 'db';
import { onError, onNoMatch, requireApiKey } from 'lib/middleware';
import type { DatabasePage } from 'lib/public-api';
import { DatabasePageNotFoundError } from 'lib/public-api';
import { filterObjectKeys } from 'lib/utilities/objects';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireApiKey)
  .get(getDatabase);

/**
 * @swagger
 * /databases/{databaseId}:
 *   get:
 *     summary: Find database by ID
 *     description: Use the ID of the Database Page, or its path ie. 'getting-started'. <br /> <br />  The board object contains the schema for the custom properties assigned to pages inside it.
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/DatabasePage'
 */
async function getDatabase (req: NextApiRequest, res: NextApiResponse) {

  const { id } = req.query;

  const spaceId = req.authorizedSpaceId;
  const space = await prisma.space.findUnique({ where: { id: spaceId } });

  if (!space) {
    return res.status(400).send({
      error: 'Space not found'
    });
  }

  const isValidUuid = validate(id as string);

  // eslint-disable-next-line prefer-const
  const database = await prisma.page.findFirst({
    where: isValidUuid ? {
      type: 'board',
      boardId: id as string,
      spaceId
    } : {
      type: 'board',
      path: id as string,
      spaceId
    }

  });

  if (!database) {
    throw new DatabasePageNotFoundError(id as string);
  }

  const board = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: database.boardId as string
    }
  }) as any as Block;

  if (!board) {
    throw new DatabasePageNotFoundError(id as string);
  }

  const filteredDatabaseObject = filterObjectKeys(database as any as DatabasePage, 'include', ['id', 'createdAt', 'updatedAt', 'type', 'title', 'url', 'spaceId']);

  const domain = process.env.DOMAIN;

  filteredDatabaseObject.url = `${domain}/${space.domain}/${database.path}`;

  (filteredDatabaseObject as any).schema = (board as any).fields.cardProperties;
  filteredDatabaseObject.id = board.id;

  return res.status(200).json(filteredDatabaseObject);
}

export default handler;
