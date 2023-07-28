import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { ThreadCreate, ThreadWithComments } from 'lib/threads';
import { createThread } from 'lib/threads';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    providePermissionClients({
      key: 'pageId',
      location: 'body',
      resourceIdType: 'page'
    })
  )
  .post(requireKeys<ThreadCreate>(['context', 'pageId', 'comment'], 'body'), startThread);

async function startThread(req: NextApiRequest, res: NextApiResponse<ThreadWithComments>) {
  const { comment, context, pageId } = req.body as ThreadCreate;

  const userId = req.session.user.id;

  const permissionSet = await req.basePermissionsClient.pages.computePagePermissions({
    resourceId: pageId,
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

  trackUserAction('page_comment_created', {
    pageId,
    userId,
    spaceId: newThread.spaceId
  });

  return res.status(201).json(newThread);
}

export default withSessionRoute(handler);
