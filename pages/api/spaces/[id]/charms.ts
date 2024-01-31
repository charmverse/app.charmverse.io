import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { getUserOrSpaceWallet } from 'lib/charms/getUserOrSpaceWallet';
import { onError, onNoMatch, requireSpaceMembership } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireSpaceMembership({ adminOnly: false, spaceIdKey: 'id' })).get(getCharmsHandler);

async function getCharmsHandler(req: NextApiRequest, res: NextApiResponse<{ balance: number; id: string } | null>) {
  const spaceId = req.query.id as string;

  const wallet = await getUserOrSpaceWallet({ spaceId, readOnly: true });

  res.status(200).json(wallet ? { balance: wallet.balance, id: wallet.id } : null);
}

export default withSessionRoute(handler);
