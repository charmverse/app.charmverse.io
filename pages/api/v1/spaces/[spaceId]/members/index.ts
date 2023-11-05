import { UnauthorisedActionError } from '@charmverse/core/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

import { isTestEnv } from 'config/constants';
import { NotFoundError, requireKeys, requireSuperApiKey } from 'lib/middleware';
import { getSummonProfile } from 'lib/profile/getSummonProfile';
import { defaultHandler } from 'lib/public-api/handler';
import type { CreateSpaceMemberRequestBody, UserProfile } from 'lib/public-api/interfaces';
import { searchUserProfile } from 'lib/public-api/searchUserProfile';
import { withSessionRoute } from 'lib/session/withSession';
import { addUserToSpace } from 'lib/summon/addUserToSpace';
import { SUMMON_BASE_URL } from 'lib/summon/api';
import { syncSummonSpaceRoles } from 'lib/summon/syncSummonSpaceRoles';
import { createUserFromWallet } from 'lib/users/createUser';

const handler = defaultHandler();

handler.use(requireKeys([{ key: 'wallet', truthy: true }], 'body')).post(requireSuperApiKey, createSpaceMember);

/**
 * @swagger
 * /spaces/{spaceId}/members:
 *   post:
 *     summary: Create user and add to space
 *     description: Create a new user and add to space. Requires a valid super API key.
 *     tags:
 *       - 'Partner API'
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                $ref: '#/components/schemas/CreateSpaceMemberRequestBody'
 *     responses:
 *       200:
 *         description: User profile and list of roles
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/UserProfile'
 */

async function createSpaceMember(req: NextApiRequest, res: NextApiResponse<UserProfile>) {
  const spaceId = req.query.spaceId as string;
  const payload = req.body as CreateSpaceMemberRequestBody;
  const spaceIds = req.spaceIdRange;
  const summonApiUrl = (isTestEnv ? req.query.summonApiUrl ?? SUMMON_BASE_URL : SUMMON_BASE_URL) as string;
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

  const summonProfile = await getSummonProfile({
    userId: user.id,
    summonApiUrl
  });

  if (!summonProfile) {
    throw new NotFoundError('Summon profile not found');
  }

  await addUserToSpace({
    spaceId,
    userId: user.id,
    userXpsEngineId: summonProfile.id
  });

  await syncSummonSpaceRoles({
    spaceId,
    userId: user.id,
    summonApiUrl
  });

  return res.status(200).json(user);
}

export default withSessionRoute(handler);
