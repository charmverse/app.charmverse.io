
import { prisma } from 'db';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';
import { withSessionRoute } from 'lib/session/withSession';
import { deleteThread, ThreadWithCommentsAndAuthors, toggleThreadStatus } from 'lib/threads';
import { DataNotFoundError } from 'lib/utilities/errors';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .delete(deleteThreadController)
  .put(requireKeys(['resolved'], 'body'), updateThread);

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
    userId,
    allowAdminBypass: false
  });

  if (!permissionSet.comment) {
    throw new ActionNotPermittedError();
  }

  await deleteThread(threadId);

  return res.status(200).json({ ok: true });
}

export interface UpdateThreadRequest {
  resolved: boolean
}

async function updateThread (req: NextApiRequest, res: NextApiResponse<ThreadWithCommentsAndAuthors>) {
  const userId = req.session.user.id as string;
  const threadId = req.query.id as string;
  const thread = await prisma.thread.findUnique({
    where: {
      id: threadId
    },
    include: {
      comments: {
        include: {
          user: true
        }
      }
    }
  });

  if (!thread) {
    throw new DataNotFoundError(`Could not find thread with id ${threadId}`);
  }

  const permissionSet = await computeUserPagePermissions({
    pageId: thread.pageId,
    userId,
    allowAdminBypass: false
  });

  if (!permissionSet.comment) {
    throw new ActionNotPermittedError();
  }

  if (typeof req.body.resolved === 'boolean') {
    const updated = await toggleThreadStatus({
      id: threadId,
      status: req.body.resolved === true ? 'closed' : 'open'
    });
    return res.status(200).json(updated);
  }
  // Empty update for now as we are only updating the resolved status
  else {
    return res.status(200).json(thread);
  }

}

export default withSessionRoute(handler);
