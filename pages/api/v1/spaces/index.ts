import { isTruthy } from '@packages/lib/utils/types';
import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

import { requireKeys, requireSuperApiKey } from 'lib/middleware';
import { createWorkspaceApi } from 'lib/public-api/createWorkspaceApi';
import { defaultHandler } from 'lib/public-api/handler';
import type { CreateWorkspaceRequestBody, CreateWorkspaceResponseBody } from 'lib/public-api/interfaces';
import { withSessionRoute } from 'lib/session/withSession';
import { spaceTemplateApiNames } from 'lib/spaces/config';

const handler = defaultHandler();

handler.use(requireSuperApiKey, requireKeys([{ key: 'name', valueType: 'string' }], 'body')).post(createSpace);

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

  if (isTruthy(template) && !spaceTemplateApiNames.includes(template)) {
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
