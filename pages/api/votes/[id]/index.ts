import type { Vote } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { hasAccessToSpace, onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import {
  getVote as getVoteService,
  updateVote as updateVoteService,
  deleteVote as deleteVoteService
} from 'lib/votes';
import type { UpdateVoteDTO } from 'lib/votes/interfaces';

import { computeUserPagePermissions } from '../../../../lib/permissions/pages';
import { DataNotFoundError, UnauthorisedActionError } from '../../../../lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getVote)
  .put(updateVote)
  .delete(deleteVote);

async function getVote (req: NextApiRequest, res: NextApiResponse<Vote | { error: any }>) {
  const voteId = req.query.id as string;
  const vote = await getVoteService(voteId, req.session.user.id);
  if (!vote) {
    return res.status(404).json({ error: 'No vote found' });
  }
  return res.status(200).json(vote);
}

async function updateVote (req: NextApiRequest, res: NextApiResponse<Vote | { error: any }>) {
  const voteId = req.query.id as string;
  const { status } = req.body as UpdateVoteDTO;
  const userId = req.session.user.id;

  const vote = await prisma.vote.findUnique({
    where: {
      id: voteId
    },
    select: {
      id: true,
      spaceId: true,
      createdBy: true,
      pageId: true
    }
  });

  if (!vote) {
    throw new DataNotFoundError(`Cannot update vote as vote with id ${voteId} was not found.`);
  }

  const pagePermissions = await computeUserPagePermissions({
    userId,
    pageId: vote.pageId,
    allowAdminBypass: true
  });

  if (!pagePermissions.create_poll) {
    throw new UnauthorisedActionError('You do not have permissions to delete the vote.');
  }
  const updatedVote = await updateVoteService(voteId, req.session.user.id, status);

  return res.status(200).json(updatedVote);
}

async function deleteVote (req: NextApiRequest, res: NextApiResponse<Vote | null | { error: any }>) {
  const voteId = req.query.id as string;

  const userId = req.session.user.id;

  const vote = await prisma.vote.findUnique({
    where: {
      id: voteId
    },
    select: {
      id: true,
      spaceId: true,
      createdBy: true,
      pageId: true
    }
  });

  if (!vote) {
    throw new DataNotFoundError(`Cannot delete vote as vote with id ${voteId} was not found.`);
  }

  const pagePermissions = await computeUserPagePermissions({
    userId,
    pageId: vote.pageId,
    allowAdminBypass: true
  });

  if (!pagePermissions.create_poll) {
    throw new UnauthorisedActionError('You do not have permissions to delete the vote.');
  }

  const deletedVote = await deleteVoteService(voteId, req.session.user.id);

  return res.status(200).json(deletedVote);
}

export default withSessionRoute(handler);
