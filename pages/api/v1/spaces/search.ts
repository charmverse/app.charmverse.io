import type { NextApiRequest, NextApiResponse } from 'next';

import { InvalidStateError } from 'lib/middleware';
import { apiHandler } from 'lib/public-api/handler';
import type { Space } from 'lib/public-api/interfaces';
import type { SearchSpacesInput } from 'lib/public-api/searchSpaces';
import { searchSpaces } from 'lib/public-api/searchSpaces';

export const handler = apiHandler().get(search);

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Search for a user.
 *     description: Search for a user profile either by known email or wallet address.
 *     tags:
 *       - 'Partner API'
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: User email to search by
 *       - in: query
 *         name: wallet
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
async function search(req: NextApiRequest, res: NextApiResponse<Space[]>) {
  const request = req.query as SearchSpacesInput;

  if (!request.creatorWalletAddress) {
    throw new InvalidStateError('creatorWalletAddress is required');
  }

  const result = await searchSpaces(request);

  return res.status(200).json(result);
}

export default handler;
