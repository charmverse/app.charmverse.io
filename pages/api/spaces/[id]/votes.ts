import { Vote } from '@prisma/client';
import { getSpaceVotes } from 'lib/votes';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getVotes);

async function getVotes (req: NextApiRequest, res: NextApiResponse<Vote[]>) {
  const spaceId = req.query.id as string;

  const votes = await getSpaceVotes(spaceId);

  return res.status(200).json(votes);
}

export default withSessionRoute(handler);
