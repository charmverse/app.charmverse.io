import { UnauthorisedActionError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { createOrGetUserFromWallet } from '@packages/users/createUser';
import { isTestEnv } from '@packages/config/constants';
import type { NextApiRequest, NextApiResponse } from 'next';

import { requireKeys, requireSuperApiKey } from '@packages/lib/middleware';
import { defaultHandler } from 'lib/public-api/handler';
import type { UserProfile } from 'lib/public-api/interfaces';
import { searchUserProfile } from 'lib/public-api/searchUserProfile';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { addUserToSpace } from '@packages/lib/summon/addUserToSpace';
import { syncSummonSpaceRoles } from '@packages/lib/summon/syncSummonSpaceRoles';

const handler = defaultHandler();

handler.use(requireKeys([{ key: 'wallet', valueType: 'wallet' }], 'body')).post(requireSuperApiKey, createSpaceMember);

/**
 * @swagger
 * /spaces/{spaceId}/members:
 *   post:
 *     summary: Create user and add to space
 *     description: Create a new user and add to space. Requires a valid super API key.
 *     tags:
 *       - 'Partner API'
 *     requestBody:
 *       required: true
 *       content:
 *          application/json:
 *             schema:
 *                required:
 *                  - wallet
 *                type: object
 *                properties:
 *                  summonUserId:
 *                    type: string
 *                    example: 'Cb817Edf301aE'
 *                  email:
 *                    type: string
 *                    example: john.doe@gmail.com
 *                  wallet:
 *                    type: string
 *                    example: '0x7684F0170a3B37640423b1CD9d8Cb817Edf301aE'
 *     responses:
 *       200:
 *         description: User profile and list of roles
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/UserProfile'
 */

type CreateSpaceMemberRequestBody = {
  email?: string;
  summonUserId?: string;
  wallet: string;
};

async function createSpaceMember(req: NextApiRequest, res: NextApiResponse<UserProfile>) {
  const spaceId = req.query.spaceId as string;
  const payload = req.body as CreateSpaceMemberRequestBody;
  const summonTestUrl = isTestEnv && typeof req.query.summonTestUrl === 'string' ? req.query.summonTestUrl : undefined; // override for testing
  const spaceIds = req.spaceIdRange;
  // For now, allow Api url to override
  if (!spaceIds || !spaceIds.length) {
    throw new UnauthorisedActionError("API key doesn't have access to any spaces");
  }

  let user: UserProfile | null = null;

  try {
    user = await searchUserProfile(payload);
  } catch (_) {
    const { user: createdUser } = await createOrGetUserFromWallet({
      address: payload.wallet,
      email: payload.email
    });
    user = await searchUserProfile({
      userId: createdUser.id
    });
  }

  await addUserToSpace({
    spaceId,
    userId: user.id,
    xpsUserId: payload.summonUserId
  });

  await syncSummonSpaceRoles({
    spaceId,
    userId: user.id,
    summonTestUrl
  });

  log.debug('[public-api] Added user to space', {
    spaceId,
    userId: user.id,
    summonUserId: payload.summonUserId
  });

  return res.status(200).json(user);
}

export default withSessionRoute(handler);
