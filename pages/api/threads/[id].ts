
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { ActionNotPermittedError, NotFoundError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { prisma } from 'db';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .delete(deleteThread)
  .put(requireKeys(['resolved'], 'body'), updateThread);

async function deleteThread (req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id as string;
  const threadId = req.query.id as string;
  const thread = await prisma.thread.findFirst({
    where: {
      id: threadId,
      userId
    },
    select: {
      pageId: true
    }
  });

  if (!thread) {
    throw new NotFoundError();
  }

  const permissionSet = await computeUserPagePermissions({
    pageId: thread.pageId,
    userId
  });

  if (!permissionSet.edit_content) {
    throw new ActionNotPermittedError();
  }

  await prisma.thread.delete({
    where: {
      id: threadId
    }
  });
  return res.status(200).json({ ok: true });
}

export interface UpdateThreadRequest {
  resolved: boolean
}

async function updateThread (req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id as string;
  const threadId = req.query.id as string;
  const thread = await prisma.thread.findFirst({
    where: {
      id: threadId,
      userId
    },
    select: {
      pageId: true
    }
  });

  if (!thread) {
    throw new NotFoundError();
  }

  const permissionSet = await computeUserPagePermissions({
    pageId: thread.pageId,
    userId
  });

  if (!permissionSet.edit_content) {
    throw new ActionNotPermittedError();
  }

  await prisma.thread.update({
    where: {
      id: threadId
    },
    data: {
      resolved: req.body.resolved,
      updatedAt: new Date()
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
