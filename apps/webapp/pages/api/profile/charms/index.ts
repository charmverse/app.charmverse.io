import { InvalidInputError } from '@charmverse/core/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import type { TransactionResult } from '@packages/lib/charms/addTransaction';
import type { CharmsBalance } from '@packages/lib/charms/getUserOrSpaceBalance';
import { getUserOrSpaceBalance } from '@packages/lib/charms/getUserOrSpaceBalance';
import { transferCharms } from '@packages/lib/charms/transferCharms';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getCharmsHandler).put(transferCharmsHandler);

async function getCharmsHandler(req: NextApiRequest, res: NextApiResponse<CharmsBalance | null>) {
  const userId = req.session.user.id;

  const balance = await getUserOrSpaceBalance({ userId, readOnly: true });

  res.status(200).json(balance);
}

async function transferCharmsHandler(req: NextApiRequest, res: NextApiResponse<TransactionResult>) {
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
