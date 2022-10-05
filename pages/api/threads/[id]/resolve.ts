
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';
import { withSessionRoute } from 'lib/session/withSession';
import type { ThreadWithCommentsAndAuthors } from 'lib/threads';
import { toggleThreadStatus } from 'lib/threads';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .put(requireKeys(['resolved'], 'body'), resolveThread);

export interface ResolveThreadRequest {
  resolved: boolean;
}

async function resolveThread (req: NextApiRequest, res: NextApiResponse<ThreadWithCommentsAndAuthors>) {
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
    userId
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
