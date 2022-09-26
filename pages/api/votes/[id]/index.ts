import type { Vote } from '@prisma/client';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getVote as getVoteService,
  updateVote as updateVoteService,
  deleteVote as deleteVoteService
} from 'lib/votes';
import nc from 'next-connect';
import type { UpdateVoteDTO } from 'lib/votes/interfaces';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getVote)
  .put(updateVote)
  .delete(deleteVote);

async function getVote (req: NextApiRequest, res: NextApiResponse<Vote | { error: any; }>) {
  const voteId = req.query.id as string;
  const vote = await getVoteService(voteId, req.session.user.id);
  if (!vote) {
    return res.status(404).json({ error: 'No vote found' });
  }
  return res.status(200).json(vote);
}

async function updateVote (req: NextApiRequest, res: NextApiResponse<Vote | { error: any; }>) {
  const voteId = req.query.id as string;
  const { status } = req.body as UpdateVoteDTO;
  const updatedVote = await updateVoteService(voteId, req.session.user.id, status);

  return res.status(200).json(updatedVote);
}

async function deleteVote (req: NextApiRequest, res: NextApiResponse<Vote | null | { error: any; }>) {
  const voteId = req.query.id as string;
  const deletedVote = await deleteVoteService(voteId, req.session.user.id);

  return res.status(200).json(deletedVote);
}

export default withSessionRoute(handler);
