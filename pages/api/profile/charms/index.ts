import { InvalidInputError } from '@charmverse/core/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { CharmTxResult } from 'lib/charms/addCharmTransaction';
import { getUserOrSpaceWallet } from 'lib/charms/getUserOrSpaceWallet';
import { transferCharms } from 'lib/charms/transferCharms';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getCharmsHandler).put(transferCharmsHandler);

async function getCharmsHandler(req: NextApiRequest, res: NextApiResponse<{ balance: number; id: string } | null>) {
  const userId = req.session.user.id;

  const wallet = await getUserOrSpaceWallet({ userId, readOnly: true });

  res.status(200).json(wallet ? { balance: wallet.balance, id: wallet.id } : null);
}

async function transferCharmsHandler(req: NextApiRequest, res: NextApiResponse<CharmTxResult>) {
  const sender = req.session.user.id;
  const recipientSpaceId = req.body.spaceId as string;
  const recipientUserId = req.body.userId as string;
  const amount = Number(req.body.amount);

  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    throw new InvalidInputError('Invalid amount');
  }

  if ((!recipientSpaceId && !recipientUserId) || (recipientSpaceId && recipientUserId)) {
    throw new InvalidInputError('Either spaceId or userId must be provided');
  }

  const txRes = await transferCharms({
    sender,
    recipient: { spaceId: recipientSpaceId, userId: recipientUserId },
    amount
  });

  res.status(200).json(txRes);
}

export default withSessionRoute(handler);
