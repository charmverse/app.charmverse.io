
import { Vote } from '@prisma/client';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { createVote as createVoteService, getVote as getVoteService } from 'lib/votes';
import { ExtendedVote, VoteDTO } from 'lib/votes/interfaces';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { prisma } from 'db';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { computeSpacePermissions } from 'lib/permissions/spaces';

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
  const pageId = newVote.pageId;
  const createdBy = newVote.createdBy;

  const existingPage = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      id: true,
      spaceId: true
    }
  });

  if (!existingPage) {
    throw new DataNotFoundError(`Cannot create poll as linked page with id ${pageId} was not found.`);
  }

  const userPermissions = await computeSpacePermissions({
    allowAdminBypass: true,
    resourceId: existingPage.spaceId,
    userId: createdBy
  });

  if (!userPermissions.createVote) {
    throw new UnauthorisedActionError('You do not have permissions to create a vote.');
  }

  const vote = await createVoteService({
    ...newVote,
    spaceId: existingPage.spaceId,
    createdBy: userId
  } as VoteDTO);

  return res.status(200).json(vote);
}

export default withSessionRoute(handler);
