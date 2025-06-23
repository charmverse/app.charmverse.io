import { onError, onNoMatch, requireSpaceMembership, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import type { SpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import { getSpaceTokenBalance } from '@packages/spaces/getSpaceTokenBalance';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { requireAdmin } from './spaces';

export type ClientSpaceTokenBalance = Omit<SpaceTokenBalance, 'value'> & { value: string; formatted: number };

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).use(requireAdmin).get(getSpaceTokenBalanceController);

async function getSpaceTokenBalanceController(req: NextApiRequest, res: NextApiResponse<ClientSpaceTokenBalance>) {
  const { id: spaceId } = req.query as { id: string };

  const { value, formatted, payments, contributions } = await getSpaceTokenBalance({ spaceId });

  res.status(200).json({
    payments,
    contributions,
    value: value.toString(),
    formatted
  });
}

export default withSessionRoute(handler);
