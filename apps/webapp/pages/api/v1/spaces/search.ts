import { InvalidStateError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

import { superApiHandler } from 'lib/public-api/handler';
import type { SpaceApiResponse } from 'lib/public-api/interfaces';
import type { SearchSpacesInput } from 'lib/public-api/searchSpaces';
import { searchSpaces } from 'lib/public-api/searchSpaces';

export const handler = superApiHandler().get(search);

/**
 * @swagger
 * /spaces/search:
 *   get:
 *     summary: Search for a user.
 *     description: Search for a user profile either by known email or wallet address.
 *     tags:
 *       - 'Partner API'
 *     parameters:
 *       - in: query
 *         name: userWallet
 *         schema:
 *           type: string
 *         description: User wallet address to search by
 *     responses:
 *       200:
 *         description: Summary of created space
 *         content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Space'
 */
async function search(req: NextApiRequest, res: NextApiResponse<SpaceApiResponse[]>) {
  const request = req.query as Omit<SearchSpacesInput, 'apiKey'>;

  if (!request.userWallet) {
    throw new InvalidStateError('userWallet is required');
  }

  const result = await searchSpaces(request);

  const allowedResult = result.filter((space) => req.spaceIdRange?.includes(space.id));

  return res.status(200).json(allowedResult);
}

export default handler;
