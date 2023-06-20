import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import type { BlockCountInfo } from 'lib/spaces/getSpaceBlockCount';
import { getSpaceBlockCount } from 'lib/spaces/getSpaceBlockCount';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' })).get(getBlockCountController);

async function getBlockCountController(req: NextApiRequest, res: NextApiResponse<BlockCountInfo>) {
  const spaceId = req.query.id as string;

  const blockCount = await getSpaceBlockCount({ spaceId });

  res.status(200).send(blockCount);
}

export default withSessionRoute(handler);
