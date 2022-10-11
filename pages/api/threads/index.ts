
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import type { ThreadCreate, ThreadWithCommentsAndAuthors } from 'lib/threads';
import { createThread } from 'lib/threads';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .post(requireKeys<ThreadCreate>(['context', 'pageId', 'comment'], 'body'), startThread);

async function startThread (req: NextApiRequest, res: NextApiResponse<ThreadWithCommentsAndAuthors>) {

  const { comment, context, pageId } = req.body as ThreadCreate;

  const userId = req.session.user.id;

  const permissionSet = await computeUserPagePermissions({
    pageId,
    userId
  });

  if (!permissionSet.comment) {
    throw new ActionNotPermittedError();
  }

  const newThread = await createThread({
    comment,
    context,
    pageId,
    userId
  });

  return res.status(201).json(newThread);
}

export default withSessionRoute(handler);
