
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { prisma } from 'db';
import { computeUserPagePermissions } from 'lib/permissions/pages/page-permission-compute';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .delete(deleteThread)
  .put(updateThread);

async function deleteThread (req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id as string;
  const thread = await prisma.thread.findFirst({
    where: {
      id: req.query.id as string,
      userId
    },
    select: {
      pageId: true
    }
  });

  if (!thread) {
    return res.status(404).json({ error: 'Thread not found' });
  }

  const permissionSet = await computeUserPagePermissions({
    pageId: thread.pageId,
    userId
  });

  if (!permissionSet.edit_content) {
    return res.status(401).json({
      error: 'You are not allowed to perform this action'
    });
  }

  await prisma.thread.delete({
    where: {
      id: req.query.id as string
    }
  });
  return res.status(200).json({ ok: true });
}

export interface UpdateThreadRequest {
  resolved: boolean
}

async function updateThread (req: NextApiRequest, res: NextApiResponse) {
  const userId = req.session.user.id as string;
  const thread = await prisma.thread.findFirst({
    where: {
      id: req.query.id as string,
      userId
    },
    select: {
      pageId: true
    }
  });

  if (!thread) {
    return res.status(404).json({ error: 'Thread not found' });
  }

  const permissionSet = await computeUserPagePermissions({
    pageId: thread.pageId,
    userId
  });

  if (!permissionSet.edit_content) {
    return res.status(401).json({
      error: 'You are not allowed to perform this action'
    });
  }

  await prisma.thread.update({
    where: {
      id: req.query.id as string
    },
    data: {
      resolved: req.body.resolved
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
