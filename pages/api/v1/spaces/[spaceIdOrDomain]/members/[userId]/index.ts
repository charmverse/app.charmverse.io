import { DataNotFoundError } from '@charmverse/core/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

import { requireKeys } from 'lib/middleware';
import { defaultHandler } from 'lib/public-api/handler';
import type { SpaceMemberRolesResponseBody } from 'lib/public-api/interfaces';
import { searchUserProfileById } from 'lib/public-api/searchUserProfile';
import { withSessionRoute } from 'lib/session/withSession';
import { getSpaceByDomain } from 'lib/spaces/getSpaceByDomain';
import { getSpaceMembershipWithRoles } from 'lib/spaces/getSpaceMembershipWithRoles';
import { isUUID } from 'lib/utilities/strings';

const handler = defaultHandler();

handler.get(getSpaceMemberWithRoles);

/**
 * @swagger
 * /spaces/{spaceIdOrDomain}/members:
 *   get:
 *     summary: Get space member and roles
 *     description: Get space member and the roles attached with that user in that space.
 *     responses:
 *       200:
 *         description: User profile and list of roles
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/SpaceMemberRolesResponseBody'
 */

async function getSpaceMemberWithRoles(req: NextApiRequest, res: NextApiResponse<SpaceMemberRolesResponseBody>) {
  const userId = req.query.userId as string;
  const spaceIdOrDomain = req.query.spaceIdOrDomain as string;
  let spaceId = isUUID(spaceIdOrDomain) ? spaceIdOrDomain : null;

  if (!spaceId) {
    const space = await getSpaceByDomain(spaceIdOrDomain);
    if (!space) {
      throw new DataNotFoundError('Space not found');
    }
    spaceId = space.id;
  }

  const spaceMember = await searchUserProfileById(userId);
  const spaceMemberWithRoles = await getSpaceMembershipWithRoles({
    spaceId,
    userId
  });

  return res.status(200).json({
    roles:
      spaceMemberWithRoles?.spaceRoleToRole.map((spaceRoleToRole) => ({
        id: spaceRoleToRole.role.id,
        name: spaceRoleToRole.role.name
      })) ?? [],
    user: spaceMember
  });
}

export default withSessionRoute(handler);
