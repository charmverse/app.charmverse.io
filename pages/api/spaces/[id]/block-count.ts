import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { getSpaceAdditionalBlockCount } from 'lib/spaces/getSpaceAdditionalBlockCount';
import { getSpaceBlockCount } from 'lib/spaces/getSpaceBlockCount';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' })).get(getBlockCountController);

async function getBlockCountController(
  req: NextApiRequest,
  res: NextApiResponse<{
    count: number;
    additionalQuota: number;
  }>
) {
  const spaceId = req.query.id as string;

  const blockCount = await getSpaceBlockCount({ spaceId });
  const additionalQuota = await getSpaceAdditionalBlockCount({ spaceId });

  res.status(200).send({
    additionalQuota: additionalQuota * 1000,
    count: blockCount.count
  });
}

export default withSessionRoute(handler);
