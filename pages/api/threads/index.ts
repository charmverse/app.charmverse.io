import { PageNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { withSessionRoute } from 'lib/session/withSession';
import type { ThreadCreatePayload, ThreadWithComments } from 'lib/threads';
import { createThread } from 'lib/threads';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishDocumentEvent } from 'lib/webhookPublisher/publishEvent';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(requireKeys<ThreadCreatePayload>(['context', 'pageId', 'comment'], 'body'), startThread);

async function startThread(req: NextApiRequest, res: NextApiResponse<ThreadWithComments>) {
  const { comment, accessGroups, context, pageId, fieldAnswerId } = req.body as ThreadCreatePayload;

  const userId = req.session.user.id;

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { id: true, spaceId: true, createdBy: true, type: true, bountyId: true, proposalId: true, cardId: true }
  });

  if (!page) {
    throw new PageNotFoundError(pageId);
  }

  const permissions = await permissionsApiClient.pages.computePagePermissions({ resourceId: pageId, userId });

  if (!permissions.comment) {
    throw new ActionNotPermittedError();
  }

  const newThread = await createThread({
    comment,
    context,
    pageId,
    userId,
    accessGroups,
    fieldAnswerId
  });

  const inlineCommentId = newThread.comments[0].id;

  await publishDocumentEvent({
    documentId: page.id,
    scope: WebhookEventNames.DocumentInlineCommentCreated,
    inlineCommentId,
    spaceId: page.spaceId
  });

  trackUserAction('page_comment_created', {
    pageId,
    userId,
    spaceId: newThread.spaceId
  });

  return res.status(201).json(newThread);
}

export default withSessionRoute(handler);
