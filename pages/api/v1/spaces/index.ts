import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSuperApiKey, requireKeys } from 'lib/middleware';
import { createWorkspaceApi } from 'lib/public-api/createWorkspaceApi';
import type { CreateWorkspaceResponseBody, CreateWorkspaceRequestBody } from 'lib/public-api/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { spaceInternalTemplateMapping } from 'lib/spaces/config';
import { InvalidInputError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSuperApiKey)
  .use(requireKeys([{ key: 'name', truthy: true }], 'body'))
  .post(createSpace);

/**
 * @swagger
 * /spaces:
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
  const {
    name,
    discordServerId,
    avatar,
    adminDiscordUserId,
    xpsEngineId,
    adminWalletAddress,
    adminAvatar,
    adminUsername,
    webhookUrl,
    template
  } = req.body as CreateWorkspaceRequestBody;

  if (isTruthy(template) && !spaceInternalTemplateMapping[template]) {
    throw new InvalidInputError('Invalid template provided.');
  }

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
    adminWalletAddress,
    adminAvatar,
    adminUsername,
    xpsEngineId,
    avatar,
    superApiToken: req.superApiToken,
    webhookUrl,
    template
  });

  return res.status(201).json(result);
}

export default withSessionRoute(handler);
