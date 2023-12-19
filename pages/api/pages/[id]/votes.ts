import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { NotFoundError, onError, onNoMatch } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/routers';
import { withSessionRoute } from 'lib/session/withSession';
import { getVotesByPage } from 'lib/votes/getVotesByPage';
import type { ExtendedVote } from 'lib/votes/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(getVotes);

async function getVotes(req: NextApiRequest, res: NextApiResponse<ExtendedVote[]>) {
  const pageId = req.query.id as string;
  const userId = req.session?.user?.id;

  const computed = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (computed.read !== true) {
    throw new NotFoundError('Page not found');
  }

  const votes = await getVotesByPage({ pageId, userId });

  return res.status(200).json(votes);
}

export default withSessionRoute(handler);
