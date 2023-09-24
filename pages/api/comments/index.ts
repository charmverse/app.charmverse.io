import { PageNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CommentCreate } from 'lib/comments';
import { addComment } from 'lib/comments';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { DataNotFoundError } from 'lib/utilities/errors';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishBountyEvent, publishPageEvent, publishProposalEvent } from 'lib/webhookPublisher/publishEvent';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(requireKeys(['content', 'threadId'], 'body'), addCommentController);

async function addCommentController(req: NextApiRequest, res: NextApiResponse) {
  const { threadId, content } = req.body as CommentCreate;
  const userId = req.session.user.id;

  const thread = await prisma.thread.findUnique({
    where: {
      id: threadId
    },
    select: {
      pageId: true,
      spaceId: true
    }
  });

  if (!thread) {
    throw new DataNotFoundError(`Thread with id ${threadId} not found`);
  }

  const pageId = thread.pageId;

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { spaceId: true, createdBy: true, type: true, bountyId: true, proposalId: true }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  const permissions = await req.basePermissionsClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
  });

  if (!permissions.comment) {
    throw new ActionNotPermittedError();
  }

  const createdComment = await addComment({
    threadId,
    userId,
    content
  });

  if (page.type === 'bounty' && page.bountyId) {
    await publishBountyEvent({
      bountyId: page.bountyId,
      scope: WebhookEventNames.BountyInlineCommentCreated,
      inlineCommentId: createdComment.id,
      spaceId: page.spaceId
    });
  } else if (page.type === 'proposal' && page.proposalId) {
    await publishProposalEvent({
      proposalId: page.proposalId,
      scope: WebhookEventNames.ProposalInlineCommentCreated,
      inlineCommentId: createdComment.id,
      spaceId: page.spaceId
    });
  } else {
    await publishPageEvent({
      pageId,
      scope: WebhookEventNames.PageInlineCommentCreated,
      inlineCommentId: createdComment.id,
      spaceId: page.spaceId,
      userId
    });
  }

  await publishPageEvent({
    pageId,
    scope: WebhookEventNames.PageInlineCommentCreated,
    inlineCommentId: createdComment.id,
    spaceId: page.spaceId,
    userId
  });

  trackUserAction('page_comment_created', {
    pageId: thread.pageId,
    userId,
    spaceId: thread.spaceId
  });

  relay.broadcast(
    {
      type: 'threads_updated',
      payload: {
        pageId: thread.pageId,
        threadId
      }
    },
    thread.spaceId
  );

  return res.status(201).json(createdComment);
}

export default withSessionRoute(handler);
