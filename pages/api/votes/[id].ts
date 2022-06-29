
import { Vote } from '@prisma/client';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  getVote as getVoteService,
  updateVote as updateVoteService,
  deleteVote as deleteVoteService,
  UpdateVoteDTO
} from 'lib/votes';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getVote)
  .put(updateVote)
  .delete(deleteVote);

async function getVote (req: NextApiRequest, res: NextApiResponse<Vote | { error: any }>) {
  const voteId = req.query.id as string;
  const vote = await getVoteService(voteId);
  if (!vote) {
    return res.status(404).json({ error: 'No vote found' });
  }
  return res.status(200).json(vote);
}

async function updateVote (req: NextApiRequest, res: NextApiResponse<Vote | { error: any }>) {
  const voteId = req.query.id as string;
  const { status } = req.body as UpdateVoteDTO;
  const updatedVote = await updateVoteService(voteId, status);

  return res.status(200).json(updatedVote);
}

async function deleteVote (req: NextApiRequest, res: NextApiResponse<Vote | null | { error: any }>) {
  const voteId = req.query.id as string;
  const deletedVote = await deleteVoteService(voteId);

  return res.status(200).json(deletedVote);
}

export default withSessionRoute(handler);
