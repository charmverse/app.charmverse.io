import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { deleteThread } from '@packages/lib/threads';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import { DataNotFoundError } from '@packages/utils/errors';
import { relay } from '@packages/websockets/relay';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).delete(deleteThreadController);

async function deleteThreadController(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id as string;
  const threadId = req.query.id as string;
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
    throw new DataNotFoundError(`Could not find thread with id ${threadId}`);
  }

  const permissionSet = await permissionsApiClient.pages.computePagePermissions({
    resourceId: thread.pageId,
    userId
  });

  if (!permissionSet.comment) {
    throw new ActionNotPermittedError();
  }

  await deleteThread(threadId);

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

  log.info(`Deleted page inline comment thread`, { userId, pageId: thread.pageId, threadId });

  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
