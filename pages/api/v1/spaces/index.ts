import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSuperApiKey, requireKeys } from 'lib/middleware';
import { createWorkspaceApi } from 'lib/public-api/createWorkspaceApi';
import type { CreateWorkspaceResponseBody, CreateWorkspaceRequestBody } from 'lib/public-api/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSuperApiKey)
  .use(requireKeys([{ key: 'name', truthy: true }], 'body'))
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
async function createSpace(req: NextApiRequest, res: NextApiResponse<CreateWorkspaceResponseBody>) {
  const { name, discordServerId, avatar, adminDiscordUserId, xpsEngineId, adminWalletAddress } =
    req.body as CreateWorkspaceRequestBody;

  if (name.length < 3) {
    throw new InvalidInputError('Workspace name must be at least 3 characters.');
  }

  if (discordServerId && !adminDiscordUserId) {
    throw new InvalidInputError('Discord server ID provided but no admin user ID provided.');
  } else if (xpsEngineId && !adminWalletAddress) {
    throw new InvalidInputError('XPS engine ID provided but no admin wallet address provided.');
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
