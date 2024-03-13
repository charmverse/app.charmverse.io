import type { CharmTransaction } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { LeaderBoardUser } from 'lib/charms/getLeaderBoard';
import { getLeaderBoard } from 'lib/charms/getLeaderBoard';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getCharmsLeaderBoardHandler);

async function getCharmsLeaderBoardHandler(req: NextApiRequest, res: NextApiResponse<LeaderBoardUser[]>) {
  const leaderBoard = await getLeaderBoard();
  res.status(200).json(leaderBoard);
}

export default withSessionRoute(handler);
