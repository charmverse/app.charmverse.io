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
 *     summary: Create a new space
 *     description: Create a new space with discord server and discord admin user. Requires a valid super API key.
 *     tags:
 *       - 'Partner API'
 *     requestBody:
 *       content:
 *          application/json:
 *             schema:
 *                $ref: '#/components/schemas/CreateWorkspaceRequestBody'
 *     responses:
 *       200:
 *         description: Summary of created space
 *         content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/CreateWorkspaceResponseBody'
 */
async function createSpace(req: NextApiRequest, res: NextApiResponse<CreateWorkspaceResponseBody>) {
  const { name, discordServerId, avatar, adminDiscordUserId, xpsEngineId, adminWalletAddress } =
    req.body as CreateWorkspaceRequestBody;

  if (typeof name !== 'string' || name.length < 3) {
    throw new InvalidInputError('Space name must be a string at least 3 characters.');
  }

  // check for an identifier for the admin user
  const adminIdentifier = adminDiscordUserId || adminWalletAddress;
  if (!adminIdentifier) {
    throw new InvalidInputError('At least one admin identifer must be provided.');
  }

  const result = await createWorkspaceApi({
    name,
    discordServerId,
    adminDiscordUserId,
    xpsEngineId,
    avatar,
    superApiToken: req.superApiToken
  });

  return res.status(201).json(result);
}

export default withSessionRoute(handler);
