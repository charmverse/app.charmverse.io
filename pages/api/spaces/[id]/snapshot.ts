
import type { Space } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { onError, onNoMatch, requireKeys, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getSnapshotSpace } from 'lib/snapshot/getSpace';
import { DataNotFoundError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .use(requireKeys(['snapshotDomain', 'defaultVotingDuration'], 'body'))
  .put(updateSnapshotConnection);

async function updateSnapshotConnection (req: NextApiRequest, res: NextApiResponse<Space>) {

  const { snapshotDomain, defaultVotingDuration } = req.body;

  const spaceId = req.query.id as string;

  const snapshotSpace = await getSnapshotSpace(snapshotDomain);

  if (!snapshotSpace) {
    throw new DataNotFoundError(`No snapshot domain ${snapshotDomain} was found`);
  }

  const space = await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      defaultVotingDuration,
      snapshotDomain
    }
  });
  return res.status(200).json(space);
}

export default withSessionRoute(handler);
