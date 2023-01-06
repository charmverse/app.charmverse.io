import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { syncFormResponses } from 'lib/google/forms/syncFormResponses';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors/errors';

export type RefreshFormsRequest = {
  viewId: string;
};

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(syncResponsesResponse);

async function syncResponsesResponse(req: NextApiRequest, res: NextApiResponse) {
  const viewId = req.body.viewId;

  if (typeof viewId !== 'string') {
    throw new InvalidInputError('View id is required');
  }

  const view = await prisma.block.findUniqueOrThrow({ where: { id: viewId } });

  await syncFormResponses({ createdBy: req.session.user.id, view });

  res.status(200).end();
}

export default withSessionRoute(handler);
