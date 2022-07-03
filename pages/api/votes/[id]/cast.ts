
import { UserVote } from '@prisma/client';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { castVote as castVoteService } from 'lib/votes';
import { UserVoteDTO } from 'lib/votes/interfaces';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys(['choice'], 'body'))
  .post(castVote);

async function castVote (req: NextApiRequest, res: NextApiResponse<UserVote | { error: any }>) {
  const { choice } = req.body as UserVoteDTO;
  const voteId = req.query.id as string;
  const userId = req.session.user.id;

  const newUserVote: UserVote = await castVoteService(choice, voteId, userId);

  return res.status(200).json(newUserVote);
}

export default withSessionRoute(handler);
