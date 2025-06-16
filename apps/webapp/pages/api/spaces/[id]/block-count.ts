import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { getSpaceBlockCount } from '@packages/spaces/getSpaceBlockCount';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' })).get(getBlockCountController);

async function getBlockCountController(
  req: NextApiRequest,
  res: NextApiResponse<{
    count: number;
  }>
) {
  const spaceId = req.query.id as string;

  const blockCount = await getSpaceBlockCount({ spaceId });
  res.status(200).send({
    count: blockCount.count
  });
}

export default withSessionRoute(handler);
