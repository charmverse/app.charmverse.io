
import { Vote } from '@prisma/client';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createVote, VoteDTO } from 'lib/votes';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getVotes)
  .post(startVote);

async function getVotes (req: NextApiRequest, res: NextApiResponse<Vote | { error: any }>) {
  const voteId = req.query.id as string;
  const vote = await getVoteService(voteId);
  if (!vote) {
    return res.status(404).json({ error: 'No vote found' });
  }
  return res.status(200).json(vote);
}

async function startVote (req: NextApiRequest, res: NextApiResponse<Vote | { error: any }>) {
  const newVote = req.body as VoteDTO;
  const userId = req.session.user.id;

  const vote = await createVote({
    ...newVote,
    createdBy: userId
  } as VoteDTO);

  return res.status(200).json(vote);
}

export default withSessionRoute(handler);
