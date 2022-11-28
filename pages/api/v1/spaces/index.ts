import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSuperApiKey, requireKeys } from 'lib/middleware';
import type { CreatedSpaceResponse, CreateSpaceApiInputData } from 'lib/public-api/createWorkspaceApi';
import { createWorkspaceApi } from 'lib/public-api/createWorkspaceApi';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSuperApiKey)
  .use(
    requireKeys(
      [
        { key: 'name', truthy: true },
        { key: 'discordServerId', truthy: true },
        { key: 'adminDiscordUserId', truthy: true }
      ],
      'body'
    )
  )
  .post(createSpace);

/**
 * @swagger
 * /api/v1/spaces:
 *   post:
 *     summary: Create a new workspace
 *     description: Create a new workspace with discord server and discord admin user. Requires a valid super API key.
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                $ref: '#/components/schemas/CreateWorkspaceRequestBody'
 *     responses:
 *       200:
 *         description: Summary of created workspace
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/CreateWorkspaceResponseBody'
 */
async function createSpace(req: NextApiRequest, res: NextApiResponse<CreatedSpaceResponse>) {
  const { name, discordServerId, avatar, adminDiscordUserId } = req.body as CreateSpaceApiInputData;

  if (name.length < 3) {
    throw new InvalidInputError('Workspace name must be at least 3 characters');
  }

  const result = await createWorkspaceApi({
    name,
    discordServerId,
    adminDiscordUserId,
    avatar,
    superApiToken: req.superApiToken
  });

  return res.status(201).json(result);
}

export default withSessionRoute(handler);
