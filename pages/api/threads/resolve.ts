import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { ActionNotPermittedError, onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { permissionsApiClient } from 'lib/permissions/api/client';
import { withSessionRoute } from 'lib/session/withSession';
import type { MultipleThreadsInput } from 'lib/threads';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireKeys<MultipleThreadsInput>(['threadIds', 'pageId'], 'body'))
  .post(resolveThreads);

async function resolveThreads(req: NextApiRequest, res: NextApiResponse) {
  const { threadIds, pageId } = req.body as MultipleThreadsInput;

  const userId = req.session.user.id;

  const permissionSet = await permissionsApiClient.pages.computePagePermissions({
    resourceId: pageId,
    userId
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

  const { spaceId } = await prisma.page.findFirstOrThrow({
    where: {
      id: pageId
    }
  });

  threadIds.forEach(() => {
    trackUserAction('page_comment_resolved', {
      pageId,
      userId,
      spaceId
    });
  });

  return res.status(201).end();
}

export default withSessionRoute(handler);
