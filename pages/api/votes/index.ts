import type { Vote } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { mapNotificationActor } from 'lib/notifications/mapNotificationActor';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { computeProposalPermissions } from 'lib/permissions/proposals/computeProposalPermissions';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError, UnauthorisedActionError } from 'lib/utilities/errors';
import { createVote as createVoteService, getVote as getVoteService } from 'lib/votes';
import type { VoteTask, ExtendedVote, VoteDTO } from 'lib/votes/interfaces';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .get(getVoteById)
  .use(requireKeys(['deadline', 'pageId', 'voteOptions', 'title', 'type', 'threshold'], 'body'))
  .post(createVote);

async function getVoteById(req: NextApiRequest, res: NextApiResponse<Vote | { error: any }>) {
  const voteId = req.query.id as string;
  const userId = req.session.user.id;
  const vote = await getVoteService(voteId, userId);
  if (!vote) {
    return res.status(404).json({ error: 'No vote found' });
  }
  return res.status(200).json(vote);
}

async function createVote(req: NextApiRequest, res: NextApiResponse<ExtendedVote | null | { error: any }>) {
  const newVote = req.body as VoteDTO;
  const userId = req.session.user.id;
  const pageId = newVote.pageId;
  const postId = newVote.postId;

  const existingPage = pageId
    ? await prisma.page.findUnique({
        where: {
          id: pageId
        },
        select: {
          id: true,
          spaceId: true,
          title: true,
          path: true,
          type: true,
          proposalId: true
        }
      })
    : null;

  const existingPost = postId
    ? await prisma.post.findUnique({
        where: {
          id: postId
        },
        select: {
          id: true,
          spaceId: true,
          path: true,
          title: true
        }
      })
    : null;

  const spaceId = existingPage?.spaceId || existingPost?.spaceId;

  if (!spaceId) {
    throw new DataNotFoundError(`Cannot create poll as linked page with id ${pageId} was not found.`);
  } else if (existingPage && existingPost) {
    throw new DataNotFoundError(
      `Cannot create poll as linked page with id ${pageId} and post with id ${postId} were both found.`
    );
  }

  // User must be proposal author or a space admin to create a poll
  if (existingPage?.type === 'proposal' && existingPage.proposalId && newVote.context === 'proposal') {
    const permissions = await computeProposalPermissions({
      resourceId: existingPage.proposalId,
      userId
    });

    if (!permissions.create_vote) {
      throw new UnauthorisedActionError(
        `Cannot create poll as user ${userId} is not an author of the linked proposal.`
      );
    }
  } else if (pageId) {
    const userPagePermissions = await computeUserPagePermissions({
      resourceId: pageId,
      userId
    });

    if (!userPagePermissions.create_poll) {
      throw new UnauthorisedActionError('You do not have permissions to create a vote.');
    }
  }

  const vote = await createVoteService({
    ...newVote,
    spaceId,
    createdBy: userId
  } as VoteDTO);
  const voteAuthor = await prisma.user.findUnique({ where: { id: userId } });

  if (pageId && vote.context === 'proposal') {
    trackUserAction('new_vote_created', {
      userId,
      pageId,
      spaceId: vote.spaceId,
      resourceId: vote.id,
      platform: 'charmverse'
    });
  } else if (pageId) {
    trackUserAction('poll_created', {
      userId,
      pageId,
      spaceId: vote.spaceId
    });
  }

  const space = await prisma.space.findUniqueOrThrow({ where: { id: vote.spaceId } });

  let voteTask: VoteTask;
  if (existingPage) {
    voteTask = {
      ...vote,
      createdBy: mapNotificationActor(voteAuthor),
      taskId: vote.id,
      spaceName: space.name,
      spaceDomain: space.domain,
      pagePath: existingPage.path,
      pageTitle: existingPage.title
    };
  } else if (existingPost) {
    voteTask = {
      ...vote,
      createdBy: mapNotificationActor(voteAuthor),
      taskId: vote.id,
      spaceName: space.name,
      spaceDomain: space.domain,
      pagePath: `forum/post/${existingPost.path}`,
      pageTitle: existingPost.title
    };
  } else {
    throw new Error('Cannot create vote task as no page or post was found.');
  }

  relay.broadcast(
    {
      type: 'votes_created',
      payload: [voteTask]
    },
    vote.spaceId
  );

  return res.status(201).json(vote);
}

export default withSessionRoute(handler);
