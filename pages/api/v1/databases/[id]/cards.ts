import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { requireKeys } from 'lib/middleware';
import { premiumPermissionsApiClient } from 'lib/permissions/api/routers';
import type { CardPage } from 'lib/public-api';
import { validateCreationData, DatabasePageNotFoundError, createDatabaseCardPage } from 'lib/public-api';
import { apiHandler } from 'lib/public-api/handler';

const handler = apiHandler();

handler.use(requireKeys<CardPage>(['title'], 'body')).post(createCard);

/**
 * @swagger
 * /databases/{databaseId}/cards:
 *   post:
 *     summary: Create a new card page in the database
 *     description: Create a new page with a title and any set of values from the custom properties in your database.
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                $ref: '#/components/schemas/CardPageQuery'
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

  const board = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: id as string
    }
  });
  if (!board || board.spaceId !== spaceId) {
    throw new DatabasePageNotFoundError(id as string);
  }

  validateCreationData(req.body);

  const card = await createDatabaseCardPage({
    ...req.body,
    boardId: id,
    spaceId,
    createdBy: req.botUser.id
  });

  await premiumPermissionsApiClient.pages.setupPagePermissionsAfterEvent({
    event: 'created',
    pageId: card.id
  });

  return res.status(201).json(card);
}

export default handler;
