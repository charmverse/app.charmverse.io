
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';
import { withSessionRoute } from 'lib/session/withSession';
import { deleteThread } from 'lib/threads';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .delete(deleteThreadController);

async function deleteThreadController (req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id as string;
  const threadId = req.query.id as string;
  const thread = await prisma.thread.findUnique({
    where: {
      id: threadId
    },
    select: {
      pageId: true
    }
  });

  if (!thread) {
    throw new DataNotFoundError(`Could not find thread with id ${threadId}`);
  }

  const permissionSet = await computeUserPagePermissions({
    pageId: thread.pageId,
    userId
  });

  if (!permissionSet.comment) {
    throw new ActionNotPermittedError();
  }

  await deleteThread(threadId);

  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
