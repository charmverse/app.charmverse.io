import { prisma } from '@charmverse/core/dist/cjs/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { InvalidStateError, requireSuperApiKey } from 'lib/middleware';
import { getSummonProfile } from 'lib/profile/getSummonProfile';
import { defaultHandler } from 'lib/public-api/handler';
import type { CreateSpaceMemberRequestBody, UserProfile } from 'lib/public-api/interfaces';
import { searchUserProfile, searchUserProfileById } from 'lib/public-api/searchUserProfile';
import { withSessionRoute } from 'lib/session/withSession';
import { getSpaceMembershipWithRoles } from 'lib/spaces/getSpaceMembershipWithRoles';
import { addUserToSpace } from 'lib/summon/addUserToSpace';
import { createUserFromWallet } from 'lib/users/createUser';

const handler = defaultHandler();

handler.post(requireSuperApiKey, createSpaceMember);

/**
 * @swagger
 * /spaces/{spaceId}/members:
 *   post:
 *     summary: Create user and add to space
 *     description: Create a new user and add to space. Requires a valid super API key.
 *      tags:
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

  if (!spaceIds || !spaceIds.length) {
    throw new InvalidStateError('Space ID is undefined');
  }

  let user: UserProfile | null = null;

  try {
    user = await searchUserProfile({ ...payload, spaceIds });
  } catch (_) {
    const createdUser = await createUserFromWallet({
      address: payload.wallet,
      email: payload.email,
      skipTracking: true
    });
    user = await searchUserProfileById(createdUser.id);
  }

  const summonProfile = await getSummonProfile({
    userId: user.id
  });

  if (!summonProfile) {
    throw new InvalidStateError('Summon profile is undefined');
  }

  await addUserToSpace({
    spaceId,
    userId: user.id,
    userXpsEngineId: summonProfile.id
  });

  return res.status(200).json(user);
}

export default withSessionRoute(handler);
