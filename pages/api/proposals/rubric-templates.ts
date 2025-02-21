import { hasAccessToSpace } from '@packages/users/hasAccessToSpace';
import { InvalidInputError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { RubricTemplate } from 'lib/proposals/rubric/getRubricTemplates';
import { getRubricTemplates } from 'lib/proposals/rubric/getRubricTemplates';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getRubricTemplatesEndpoint);

async function getRubricTemplatesEndpoint(req: NextApiRequest, res: NextApiResponse<RubricTemplate[]>) {
  const spaceId = req.query.spaceId as string | undefined;
  const excludeEvaluationId = req.query.excludeEvaluationId as string;
  const userId = req.session.user.id;

  if (!spaceId) {
    throw new InvalidInputError('spaceId is required');
  }
  if (!excludeEvaluationId) {
    throw new InvalidInputError('excludeEvaluationId is required');
  }

  const { error } = await hasAccessToSpace({
    spaceId,
    userId,
    adminOnly: false
  });

  if (error) {
    throw error;
  }

  const templates = await getRubricTemplates({ excludeEvaluationId, spaceId });

  res.status(200).send(templates);
}

export default withSessionRoute(handler);
