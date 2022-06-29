
import { Vote } from '@prisma/client';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createVote, VoteDTO } from 'lib/votes';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .post(startVote);

async function startVote (req: NextApiRequest, res: NextApiResponse<Vote | { error: any }>) {
  const newVote = req.body as VoteDTO;
  const userId = req.session.user.id;

  const vote = await createVote({
    ...newVote,
    initiatorId: userId
  } as VoteDTO);

  return res.status(200).json(vote);
}

export default withSessionRoute(handler);
