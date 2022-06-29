
import { UserVote } from '@prisma/client';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { castVote as castVoteService, UserVoteDTO } from 'lib/userVotes';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .post(castVote);

async function castVote (req: NextApiRequest, res: NextApiResponse<UserVote | { error: any }>) {
  const userVote = req.body as UserVoteDTO;

  const newUserVote: UserVote = await castVoteService({
    ...userVote,
    userId: req.session.user.id
  });

  return res.status(200).json(newUserVote);
}

export default withSessionRoute(handler);
