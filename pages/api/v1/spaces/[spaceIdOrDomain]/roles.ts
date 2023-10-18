import { DataNotFoundError } from '@charmverse/core/errors';
import type { Space } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';

import { mapSpace } from 'lib/public-api/createWorkspaceApi';
import { getSpaceById } from 'lib/public-api/getSpaceById';
import { defaultHandler } from 'lib/public-api/handler';
import type { GetSpaceWithRolesResponseBody } from 'lib/public-api/interfaces';
import { listSpaceRoles } from 'lib/public-api/listSpaceRoles';
import { withSessionRoute } from 'lib/session/withSession';
import { getSpaceByDomain } from 'lib/spaces/getSpaceByDomain';
import { isUUID } from 'lib/utilities/strings';

const handler = defaultHandler();

handler.get(getSpaceWithRoles);

/**
 * @swagger
 * /spaces/{spaceIdOrDomain}/roles:
 *   get:
 *     summary: Get space and roles
 *     description: Get space and the roles created in that space.
 *     responses:
 *       200:
 *         description:
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/GetSpaceWithRolesResponseBody'
 */
async function getSpaceWithRoles(req: NextApiRequest, res: NextApiResponse<GetSpaceWithRolesResponseBody>) {
  const spaceIdOrDomain = req.query.spaceIdOrDomain as string;
  const space: Space | null = isUUID(spaceIdOrDomain)
    ? await getSpaceById(spaceIdOrDomain)
    : await getSpaceByDomain(spaceIdOrDomain);

  if (!space) {
    throw new DataNotFoundError('Space not found');
  }

  const spaceRoles = await listSpaceRoles(space.id);

  return res.status(200).json({
    roles: spaceRoles,
    space: mapSpace(space)
  });
}

export default withSessionRoute(handler);
