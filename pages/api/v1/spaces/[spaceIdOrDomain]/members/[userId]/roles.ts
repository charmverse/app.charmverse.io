import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

import { requireKeys } from 'lib/middleware';
import { defaultHandler } from 'lib/public-api/handler';
import type { SpaceMemberRolesResponseBody, UpdateSpaceMemberRolesRequestBody } from 'lib/public-api/interfaces';
import { searchUserProfileById } from 'lib/public-api/searchUserProfile';
import { createAndAssignRoles } from 'lib/roles/createAndAssignRoles';
import { withSessionRoute } from 'lib/session/withSession';
import { getSpaceByDomain } from 'lib/spaces/getSpaceByDomain';
import { isUUID } from 'lib/utilities/strings';
import { isTruthy } from 'lib/utilities/types';

const handler = defaultHandler();

handler.use(requireKeys([{ key: 'roles', truthy: true }], 'body')).post(updateSpaceMemberRoles);

/**
 * @swagger
 * /spaces/{spaceIdOrDomain}/members:
 *   post:
 *     summary: Assign or update roles for a user in a space
 *     description: Assign or update roles for a user in a space.
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                $ref: '#/components/schemas/UpdateSpaceMemberRolesRequestBody'
 *     responses:
 *       201:
 *         description: User profile and list of roles
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/SpaceMemberRolesResponseBody'
 */
async function updateSpaceMemberRoles(req: NextApiRequest, res: NextApiResponse<SpaceMemberRolesResponseBody>) {
  const { roles } = req.body as UpdateSpaceMemberRolesRequestBody;
  const userId = req.query.userId as string;
  if (roles.length === 0) {
    throw new InvalidInputError('At least one role must be provided.');
  }

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
  const rolesRecord = await createAndAssignRoles({
    userId,
    spaceId,
    roles: roles.map((role) => ({ name: role })),
    source: null
  });

  if (!rolesRecord) {
    throw new DataNotFoundError(`User ${userId} is not a member of space ${spaceId}`);
  }

  return res.status(200).json({
    roles: Object.values(rolesRecord)
      .filter(isTruthy)
      .map((role) => ({
        id: role.id,
        name: role.name
      })),
    user: spaceMember
  });
}

export default withSessionRoute(handler);
