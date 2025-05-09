import { InvalidStateError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

import { superApiHandler } from 'lib/public-api/handler';
import type { UserProfile } from 'lib/public-api/interfaces';
import { searchUserProfile } from 'lib/public-api/searchUserProfile';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = superApiHandler();

handler.get(searchUser);

/**
 *
 * @swagger
 * components:
 *  schemas:
 *    SearchUserResponseBody:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        wallet:
 *          type: string
 *          example: '0x7684F0170a3B37640423b1CD9d8Cb817Edf301aE'
 *        username:
 *          type: string
 *          example: admin
 *        email:
 *          type: string
 *          example: admin@example.com
 *        avatar:
 *          type: url
 *          example: https://s3.amazonaws.com/charm.public/user-content/test/logo.jpg
 */
type SearchUserResponseBody = UserProfile;

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
 *         name: userId
 *         schema:
 *           type: string
 *         description: User id to search by
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
 *         description: Found user profile
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/SearchUserResponseBody'
 */
async function searchUser(req: NextApiRequest, res: NextApiResponse<SearchUserResponseBody>) {
  const email = (req.query.email as string) || '';
  const wallet = (req.query.wallet as string) || '';
  const userId = (req.query.userId as string) || '';
  const spaceIds = req.spaceIdRange;

  if (!spaceIds || !spaceIds.length) {
    throw new InvalidStateError('Space ID is undefined');
  }

  const result = await searchUserProfile({ email, wallet, userId, spaceIds });

  return res.status(200).json(result);
}

export default withSessionRoute(handler);
