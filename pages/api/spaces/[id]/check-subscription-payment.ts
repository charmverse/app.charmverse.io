import { waitForDecentV4TransactionSettlement } from '@root/lib/decent/waitForDecentV4TransactionSettlement';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { NotFoundError, onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';
import { getActiveSpaceSubscription } from 'lib/subscription/getActiveSpaceSubscription';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .get(checkSubscriptionPaymentController);

export type CheckSubscriptionPaymentRequest = {
  hash: string;
  chainId: number;
};

async function checkSubscriptionPaymentController(req: NextApiRequest, res: NextApiResponse<string>) {
  const { id: spaceId } = req.query as { id: string };
  const { hash, chainId } = req.body as CheckSubscriptionPaymentRequest;

  const subscriptionData = await getActiveSpaceSubscription({ spaceId });

  if (!subscriptionData) {
    throw new NotFoundError(`Subscription not found for space ${spaceId}`);
  }

  const destinationTxHash = await waitForDecentV4TransactionSettlement({
    sourceTxHash: hash.toLowerCase(),
    sourceTxHashChainId: chainId
  });

  res.status(200).json(destinationTxHash);
}
