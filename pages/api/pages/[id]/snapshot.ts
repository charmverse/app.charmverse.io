import type { PageMeta } from '@charmverse/core/pages';
import type { Page } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireUser } from 'lib/middleware';
import { getPage } from 'lib/pages/server';
import { providePermissionClients } from 'lib/permissions/api/permissionsClientMiddleware';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';
import { DataNotFoundError } from 'lib/utilities/errors';
import { relay } from 'lib/websockets/relay';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(
    providePermissionClients({
      key: 'id',
      location: 'query',
      resourceIdType: 'page'
    })
  )
  .use(requireKeys<Page>(['snapshotProposalId'], 'body'))
  .put(recordSnapshotInfo);

async function recordSnapshotInfo(req: NextApiRequest, res: NextApiResponse<PageMeta>) {
  const { snapshotProposalId } = req.body;

  const pageId = req.query.id as string;

  const page = await getPage(pageId);

  if (!page) {
    throw new DataNotFoundError();
  }

  const { error } = await hasAccessToSpace({
    spaceId: page.spaceId as string,
    userId: req.session.user.id
  });

  if (error) {
    throw error;
  }

  await prisma.page.update({
    where: {
      id: pageId
    },
    data: {
      snapshotProposalId
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      }
    }
  });

  // update the UI
  relay.broadcast(
    {
      type: 'pages_meta_updated',
      payload: [{ snapshotProposalId, spaceId: page.spaceId, id: pageId }]
    },
    page.spaceId
  );

  res.status(200).end();
}

export default withSessionRoute(handler);
