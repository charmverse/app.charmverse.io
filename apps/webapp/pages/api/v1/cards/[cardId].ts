import { SpaceAccessDeniedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getCardPageInDatabase } from 'lib/public-api';
import { apiHandler } from 'lib/public-api/handler';
import { updateDatabaseCardPage } from 'lib/public-api/updateDatabaseCardPage';

const handler = apiHandler();

handler.get(getCard).patch(updateCard);

/**
 * @swagger
 * /cards/{cardIdOrPath}:
 *   get:
 *     summary: Find card page by ID
 *     tags:
 *      - 'Space API'
 *     parameters:
 *       - name: cardIdOrPath
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID or path of the card to retrieve
 *     responses:
 *       200:
 *         description: Card page with content and properties
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/CardPage'
 */
export async function getCard(req: NextApiRequest, res: NextApiResponse) {
  const { cardId } = req.query;

  const spaceId = req.authorizedSpaceId;

  const page = await getCardPageInDatabase({ cardId: cardId as string, spaceId });

  if (spaceId !== page.spaceId) {
    throw new SpaceAccessDeniedError();
  }

  return res.status(200).json(page);
}

/**
 * @swagger
 * /cards/{cardIdOrPath}:
 *   patch:
 *     summary: Update a card in a database
 *     description: Update a page's title and / or its custom properties.
 *     tags:
 *      - 'Space API'
 *     parameters:
 *      - name: cardIdOrPath
 *        in: path
 *        required: true
 *        schema:
 *          type: string
 *        description: ID or path of the card to retrieve
 *     requestBody:
 *       content:
 *          application/json:
 *                schema:
 *                  $ref: '#/components/schemas/CardPageUpdateData'
 *     responses:
 *       200:
 *         description: Returns the updated page
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Page'
 */
async function updateCard(req: NextApiRequest, res: NextApiResponse) {
  const { cardId } = req.query;

  const spaceId = req.authorizedSpaceId;

  const updatedCard = await updateDatabaseCardPage({
    cardId: cardId as string,
    updatedBy: req.botUser?.id,
    update: req.body,
    spaceId
  });

  return res.status(200).json(updatedCard);
}

export default handler;
