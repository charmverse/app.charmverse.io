import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { NotFoundError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import { getVotesByPage } from 'lib/votes';
import type { ExtendedVote } from 'lib/votes/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getVotes);

async function getVotes (req: NextApiRequest, res: NextApiResponse<ExtendedVote[]>) {
  const pageId = req.query.id as string;

  const computed = await computeUserPagePermissions({
    pageId,
    userId: req.session?.user?.id
  });

  if (computed.read !== true) {
    throw new NotFoundError('Page not found');
  }

  const votes = await getVotesByPage({ pageId, userId: req.session.user.id });

  return res.status(200).json(votes);
}

export default withSessionRoute(handler);
