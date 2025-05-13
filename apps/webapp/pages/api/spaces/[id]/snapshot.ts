import type { Space } from '@charmverse/core/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireKeys, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { updateSnapshotDomain } from 'lib/spaces/updateSnapshotDomain';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .use(requireKeys(['snapshotDomain'], 'body'))
  .put(updateSnapshotConnection);

async function updateSnapshotConnection(req: NextApiRequest, res: NextApiResponse<Space>) {
  const { snapshotDomain } = req.body;

  const spaceId = req.query.id as string;

  const space = await updateSnapshotDomain(spaceId, snapshotDomain);

  return res.status(200).json(space);
}

export default withSessionRoute(handler);
