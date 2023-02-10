import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { InvalidStateError, onError, onNoMatch, requireSuperApiKey, retrieveSuperApiKeySpaceIds } from 'lib/middleware';
import type { UserProfile } from 'lib/public-api/interfaces';
import { searchUserProfile } from 'lib/public-api/searchUserProfile';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSuperApiKey).get(searchUser);

/**
 * @example https://github.com/jellydn/next-swagger-doc/blob/main/example/models/organization.ts
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
 *          example: 0x7684F0170a3B37640423b1CD9d8Cb817Edf301aE
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
  const spaceIds = await retrieveSuperApiKeySpaceIds(req);
  const result = await searchUserProfile({ email, wallet, spaceIds });

  return res.status(200).json(result);
}

export default withSessionRoute(handler);
