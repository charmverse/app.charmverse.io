import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { getSpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' }))
  .get(getSpaceTokenBalanceController);

async function getSpaceTokenBalanceController(
  req: NextApiRequest,
  res: NextApiResponse<{ value: string; formatted: number }>
) {
  const { id: spaceId } = req.query as { id: string };

  const { value, formatted } = await getSpaceTokenBalance({ spaceId });

  res.status(200).json({
    value: value.toString(),
    formatted
  });
}

export default withSessionRoute(handler);
