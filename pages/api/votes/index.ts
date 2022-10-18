
import type { Vote } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { hasAccessToSpace, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { createVote as createVoteService, getVote as getVoteService } from 'lib/votes';
import type { ExtendedVote, VoteDTO } from 'lib/votes/interfaces';

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

  const existingPage = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    select: {
      id: true,
      spaceId: true,
      type: true,
      proposal: {
        include: {
          authors: true
        }
      }
    }
  });

  if (!existingPage) {
    throw new DataNotFoundError(`Cannot create poll as linked page with id ${pageId} was not found.`);
  }

  // User must be proposal author or a space admin to create a poll
  if (existingPage.type === 'proposal' && newVote.context === 'proposal') {
    if (existingPage.proposal?.authors.every(a => a.userId !== userId) && (await hasAccessToSpace({
      userId, spaceId: existingPage.spaceId, adminOnly: true })).error) {
      throw new UnauthorisedActionError(`Cannot create poll as user ${userId} is not an author of the linked proposal.`);
    }
  }
  else {
    const userPagePermissions = await computeUserPagePermissions({
      pageId,
      userId,
      allowAdminBypass: true
    });

    if (!userPagePermissions.create_poll) {
      throw new UnauthorisedActionError('You do not have permissions to create a vote.');
    }
  }

  const vote = await createVoteService({
    ...newVote,
    spaceId: existingPage.spaceId,
    createdBy: userId
  } as VoteDTO);

  if (vote.context === 'proposal') {
    trackUserAction('new_vote_created', { userId, pageId, spaceId: vote.spaceId, resourceId: vote.id, platform: 'charmverse' });
  }

  return res.status(201).json(vote);
}

export default withSessionRoute(handler);
