import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { RubricTemplate } from 'lib/proposals/rubric/getRubricTemplates';
import { getRubricTemplates } from 'lib/proposals/rubric/getRubricTemplates';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { InvalidInputError } from 'lib/utils/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(getRubricTemplatesEndpoint);

async function getRubricTemplatesEndpoint(req: NextApiRequest, res: NextApiResponse<RubricTemplate[]>) {
  const spaceId = req.query.spaceId as string | undefined;
  const userId = req.session.user.id;

  if (!spaceId) {
    throw new InvalidInputError('spaceId is required');
  }

  const { error } = await hasAccessToSpace({
    spaceId,
    userId,
    adminOnly: false
  });

  if (error) {
    throw error;
  }

  const templates = await getRubricTemplates({ spaceId });

  res.status(200).send(templates);
}

export default withSessionRoute(handler);
