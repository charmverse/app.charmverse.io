
import type { Space } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSuperApiKey, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { CreateSpaceApiInputData } from 'lib/spaces/createWorkspaceApi';
import { createWorkspaceApi } from 'lib/spaces/createWorkspaceApi';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSuperApiKey)
  .post(createSpace);

async function createSpace (req: NextApiRequest, res: NextApiResponse<Space>) {
  const { name, discordServerId, avatar, adminDiscordUserId } = req.body as CreateSpaceApiInputData;

  if (!name) {
    throw new InvalidInputError('Missing space name');
  }

  if (name.length < 3) {
    throw new InvalidInputError('Space name must be at least 3 characters');
  }

  if (!discordServerId) {
    throw new InvalidInputError('Missing discord server id');
  }

  if (!adminDiscordUserId) {
    throw new InvalidInputError('Missing discord admin id');
  }

  const space = await createWorkspaceApi({ name, discordServerId, adminDiscordUserId, avatar, superApiToken: req.superApiToken });

  return res.status(201).json(space);
}

export default withSessionRoute(handler);

