
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireApiKey, requireKeys } from 'lib/middleware';
import { setupPermissionsAfterPageCreated } from 'lib/permissions/pages';
import type { Page } from 'lib/public-api';
import { validateCreationData, DatabasePageNotFoundError, createDatabaseCardPage } from 'lib/public-api';

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
export async function createPage (req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const spaceId = req.authorizedSpaceId;

  const board = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: id as string
    }
  });

  if (!board || (board.spaceId !== spaceId)) {
    throw new DatabasePageNotFoundError(id as string);
  }

  validateCreationData(req.body);

  const card = await createDatabaseCardPage({
    ...req.body,
    boardId: id,
    spaceId,
    createdBy: req.botUser.id
  });

  await setupPermissionsAfterPageCreated(card.id);

  return res.status(201).json(card);

}

export default handler;
