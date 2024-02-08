import { UnauthorisedActionError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';

import { isTestEnv } from 'config/constants';
import { requireKeys, requireSuperApiKey } from 'lib/middleware';
import { defaultHandler } from 'lib/public-api/handler';
import type { UserProfile } from 'lib/public-api/interfaces';
import { searchUserProfile } from 'lib/public-api/searchUserProfile';
import { withSessionRoute } from 'lib/session/withSession';
import { addUserToSpace } from 'lib/summon/addUserToSpace';
import { DEFAULT_TENANT_ID, DEFAULT_URL } from 'lib/summon/constants';
import { syncSummonSpaceRoles } from 'lib/summon/syncSummonSpaceRoles';
import { createUserFromWallet } from 'lib/users/createUser';

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
  const spaceIds = req.spaceIdRange;
  const summonTenantId = req.query.summonTenantId;
  const summonApiUrl = (isTestEnv ? req.query.summonApiUrl ?? DEFAULT_URL : DEFAULT_URL) as string;
  // For now, allow Api url to override
  if (!spaceIds || !spaceIds.length) {
    throw new UnauthorisedActionError("API key doesn't have access to any spaces");
  }

  let user: UserProfile | null = null;

  try {
    user = await searchUserProfile(payload);
  } catch (_) {
    const createdUser = await createUserFromWallet({
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
    userXpsEngineId: payload.summonUserId
  });

  await syncSummonSpaceRoles({
    spaceId,
    userId: user.id,
    summonApiUrl
  });

  log.debug('[public-api] Added user to space', { spaceId, userId: user.id, summonUserId: payload.summonUserId });

  return res.status(200).json(user);
}

export default withSessionRoute(handler);
