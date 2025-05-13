import { prisma } from '@charmverse/core/prisma-client';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { withSessionRoute } from '@root/lib/session/withSession';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { base } from 'viem/chains';

import { onError, onNoMatch, requireSpaceMembership, requireUser } from 'lib/middleware';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireUser)
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .post(createSpaceContributionController);

export type CreateSpaceContributionRequest = {
  hash: string;
  walletAddress: string;
  paidTokenAmount: string;
};

const recipientAddress = '0x84a94307CD0eE34C8037DfeC056b53D7004f04a0';
const devTokenAddress = '0x047157cffb8841a64db93fd4e29fa3796b78466c';

async function createSpaceContributionController(req: NextApiRequest, res: NextApiResponse<string>) {
  const { id: spaceId } = req.query as { id: string };
  const userId = req.session.user.id;
  const { hash, walletAddress, paidTokenAmount } = req.body as CreateSpaceContributionRequest;

  const publicClient = getPublicClient(base.id);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: hash.toLowerCase() as `0x${string}` });

  if (receipt.status !== 'success') {
    throw new Error('Transaction failed');
  }

  const tx = await publicClient.getTransaction({ hash: hash.toLowerCase() as `0x${string}` });

  if (tx.from.toLowerCase() !== walletAddress.toLowerCase()) {
    throw new Error('Transaction sender does not match provided wallet address');
  }

  // Get the transfer logs from the transaction
  const logs = await publicClient.getLogs({
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber,
    address: devTokenAddress,
    event: {
      type: 'event',
      name: 'Transfer',
      inputs: [
        { type: 'address', name: 'from', indexed: true },
        { type: 'address', name: 'to', indexed: true },
        { type: 'uint256', name: 'value' }
      ]
    }
  });

  if (logs.length === 0) {
    throw new Error('No transfer event found in transaction');
  }

  const transferLog = logs.find(
    (log) =>
      log.args.to &&
      log.args.from &&
      log.args.to.toLowerCase() === recipientAddress.toLowerCase() &&
      log.args.from.toLowerCase() === walletAddress.toLowerCase()
  );

  if (!transferLog || transferLog.args.value !== BigInt(paidTokenAmount)) {
    throw new Error('Transfer amount does not match paid token amount');
  }

  const spaceContribution = await prisma.spaceSubscriptionContribution.create({
    data: {
      spaceId,
      walletAddress,
      paidTokenAmount,
      decentPayload: {},
      decentStatus: 'success',
      chainId: base.id,
      txHash: hash.toLowerCase() as `0x${string}`,
      userId
    }
  });

  res.status(200).json(spaceContribution.id);
}

export default withSessionRoute(handler);
