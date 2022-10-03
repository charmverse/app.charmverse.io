
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { UserVoteExtendedDTO } from 'lib/votes/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getUserVotes);

async function getUserVotes (req: NextApiRequest, res: NextApiResponse<UserVoteExtendedDTO[] | { error: any }>) {
  const voteId = req.query.id as string;

  const userVotes = await prisma.userVote.findMany({
    where: {
      voteId
    },
    include: {
      user: {
        select: {
          username: true,
          avatar: true
        }
      }
    }
  });

  return res.status(200).json(userVotes);
}

export default withSessionRoute(handler);
