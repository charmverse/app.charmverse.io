import type { NextApiRequest, NextApiResponse } from 'next';

import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { createDatabaseCardPage, validateCreationData } from 'lib/public-api';
import { apiHandler } from 'lib/public-api/handler';

const handler = apiHandler();

handler.post(createCard);

/**
 * @swagger
 * /databases/{databaseIdOrPath}/cards:
 *   post:
 *     summary: Create a new card in the database
 *     description: Create a new card with a title and any set of values from the custom properties in your database.
 *     tags:
 *      - 'Space API'
 *     parameters:
 *      - name: databaseIdOrPath
 *        in: path
 *        required: true
 *        schema:
 *          type: string
 *        description: ID or path of the database to create a card in
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                $ref: '#/components/schemas/CardPageCreationData'
 *     responses:
 *       200:
 *         description: Summary of the database
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/CardPage'
 */
export async function createCard(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const spaceId = req.authorizedSpaceId;

  validateCreationData(req.body);

  const card = await createDatabaseCardPage({
    ...req.body,
    boardId: id,
    spaceId,
    createdBy: req.botUser.id
  });

  await permissionsApiClient.pages.setupPagePermissionsAfterEvent({
    event: 'created',
    pageId: card.id
  });

  return res.status(201).json(card);
}

export default handler;
