import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { getPermissionsClient } from 'lib/permissions/api';
import { withSessionRoute } from 'lib/session/withSession';
import { deleteThread } from 'lib/threads';
import { DataNotFoundError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';

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

  const permissionSet = await getPermissionsClient({
    resourceId: thread.pageId,
    resourceIdType: 'page'
  }).then(({ client }) =>
    client.pages.computePagePermissions({
      resourceId: thread.pageId,
      userId
    })
  );

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
