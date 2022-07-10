
import { Vote } from '@prisma/client';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createVote as createVoteService, getVote as getVoteService } from 'lib/votes';
import { ExtendedVote, VoteDTO } from 'lib/votes/interfaces';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getVoteById)
  .use(requireKeys(['deadline', 'pageId', 'voteOptions', 'title', 'type', 'threshold'], 'body'))
  .post(createVote);

async function getVoteById (req: NextApiRequest, res: NextApiResponse<Vote | { error: any }>) {
  const voteId = req.query.id as string;
  const userId = req.session.user.id;
  const vote = await getVoteService(voteId, userId);
  if (!vote) {
    return res.status(404).json({ error: 'No vote found' });
  }
  return res.status(200).json(vote);
}

async function createVote (req: NextApiRequest, res: NextApiResponse<ExtendedVote | null | { error: any }>) {
  const newVote = req.body as VoteDTO;
  const userId = req.session.user.id;

  const vote = await createVoteService({
    ...newVote,
    createdBy: userId
  } as VoteDTO);

  return res.status(200).json(vote);
}

export default withSessionRoute(handler);
