
import { prisma } from 'db';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import { ResolveMultipleThreads } from 'lib/threads';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .post(requireKeys<ResolveMultipleThreads>(['threadIds', 'pageId'], 'body'), resolveThreads);

async function resolveThreads (req: NextApiRequest, res: NextApiResponse) {

  const { threadIds, pageId } = req.body as {
    threadIds: string[],
    pageId: string
  };

  const userId = req.session.user.id;

  const permissionSet = await computeUserPagePermissions({
    pageId,
    userId,
    allowAdminBypass: false
  });

  if (!permissionSet.comment) {
    throw new ActionNotPermittedError();
  }

  await prisma.thread.updateMany({
    where: {
      id: {
        in: threadIds
      }
    },
    data: {
      resolved: true
    }
  });

  return res.status(201).json({ ok: true });
}

export default withSessionRoute(handler);
