
import { prisma } from 'db';
import { onError, onNoMatch, requireApiKey, requireKeys } from 'lib/middleware';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { v4 } from 'uuid';
import { Page, PageProperty, mapProperties, PageFromBlock, validateCreationData, createDatabaseCardPage } from 'lib/public-api';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireApiKey)
  .use(requireKeys<Page>(['title'], 'body'))
  .post(createPage);

/**
 * @swagger
 * /databases/{databaseId}/pages:
 *   post:
 *     summary: Create a new page in the database
 *     description: Create a new page with a title and any set of values from the custom properties in your database.
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                $ref: '#/components/schemas/PageQuery'
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Page'
 */
async function createPage (req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const spaceId = req.authorizedSpaceId;

  const board = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: id as string,
      spaceId
    }
  });

  if (!board) {
    return res.status(404).send({ error: 'Database not found' });
  }

  const { title, properties } = req.body;

  try {
    validateCreationData(req.body);

  }
  catch (error) {
    return res.status(400).json(error);
  }

  const boardSchema = (board.fields as any).cardProperties as PageProperty [];

  let propertiesToAdd: Record<string, string | number> = {};

  try {
    propertiesToAdd = mapProperties(properties, boardSchema);
  }
  catch (error) {
    return res.status(400).json(error);
  }

  validateCreationData(req.body);

  const card = await createDatabaseCardPage({
    ...req.body,
    boardId: id,
    spaceId,
    createdBy: req.botUser.id,
    properties: propertiesToAdd,
    title
  });

  return res.status(201).send(card);

}

export default handler;
