import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch, requireKeys, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { ThreadWithComments } from '@packages/lib/threads';
import { toggleThreadStatus } from '@packages/lib/threads';
import { threadIncludeClause } from '@packages/lib/threads/utils';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import { DataNotFoundError } from '@packages/utils/errors';
import { relay } from '@packages/websockets/relay';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).put(requireKeys(['resolved'], 'body'), resolveThread);

export interface ResolveThreadRequest {
  resolved: boolean;
}

async function resolveThread(req: NextApiRequest, res: NextApiResponse<ThreadWithComments>) {
  const userId = req.session.user.id as string;
  const threadId = req.query.id as string;
  const thread = await prisma.thread.findUnique({
    where: {
      id: threadId
    },
    include: threadIncludeClause()
  });

  if (!thread) {
    throw new DataNotFoundError(`Could not find thread with id ${threadId}`);
  }

  const permissionSet = await permissionsApiClient.pages.computePagePermissions({
    resourceId: thread.pageId,
    userId
  });

  if (!permissionSet.comment) {
    throw new ActionNotPermittedError();
  }

  if (typeof req.body.resolved === 'boolean') {
    const updatedThread = await toggleThreadStatus({
      id: threadId,
      status: req.body.resolved === true ? 'closed' : 'open'
    });
    if (req.body.resolved) {
      trackUserAction('page_comment_resolved', {
        pageId: thread.pageId,
        userId,
        spaceId: thread.spaceId
      });
    }

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
    return res.status(200).json(updatedThread);
  }
  // Empty update for now as we are only updating the resolved status
  else {
    return res.status(200).json(thread as unknown as ThreadWithComments);
  }
}

export default withSessionRoute(handler);
