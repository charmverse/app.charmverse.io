import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { mapNotificationActor } from 'lib/notifications/mapNotificationActor';
import { getPermissionsClient } from 'lib/permissions/api/routers';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError, UnauthorisedActionError } from 'lib/utilities/errors';
import { createVote as createVoteService } from 'lib/votes';
import { getVotesByPage } from 'lib/votes/getVotesByPage';
import type { ExtendedVote, VoteDTO, VoteTask } from 'lib/votes/interfaces';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getVotes)
  .use(requireUser)
  .use(requireKeys(['deadline', 'voteOptions', 'title', 'type', 'threshold'], 'body'))
  .post(createVote);

async function getVotes(req: NextApiRequest, res: NextApiResponse<ExtendedVote[]>) {
  const postId = req.query.postId as string;
  const pageId = req.query.pageId as string;
  const userId = req.session?.user?.id;

  if (pageId) {
    const computed = await computeUserPagePermissions({
      resourceId: pageId,
      userId
    });

    if (computed.read !== true) {
      throw new UnauthorisedActionError('You do not have access to the page');
    }
  } else if (postId) {
    const computed = await getPermissionsClient({
      resourceId: postId,
      resourceIdType: 'post'
    }).then(({ client }) =>
      client.forum.computePostPermissions({
        resourceId: postId,
        userId
      })
    );

    if (computed.view_post !== true) {
      throw new UnauthorisedActionError('You do not have access to the post');
    }
  } else {
    throw new InvalidInputError('Must provide either a pageId or postId to get votes');
  }

  const votes = await getVotesByPage({ pageId, postId, userId });
  return res.status(200).json(votes);
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
  // User must be proposal author or a space admin to create a poll
  if (existingPage?.type === 'proposal' && existingPage.proposalId && newVote.context === 'proposal') {
    const permissions = await getPermissionsClient({
      resourceId: existingPage.proposalId,
      resourceIdType: 'proposal'
    }).then(({ client }) =>
      client.proposals.computeProposalPermissions({
        resourceId: existingPage.proposalId as string,
        userId
      })
    );

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

  let voteTask: VoteTask | undefined;
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
    log.debug('Cannot create vote task as no page or post was found.');
  }

  if (voteTask) {
    relay.broadcast(
      {
        type: 'votes_created',
        payload: [voteTask]
      },
      vote.spaceId
    );
  }

  return res.status(201).json(vote);
}

export default withSessionRoute(handler);
