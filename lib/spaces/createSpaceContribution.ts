import { prisma } from '@charmverse/core/prisma-client';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { verifyMessage } from 'viem';
import { base } from 'viem/chains';

const recipientAddress = '0x84a94307CD0eE34C8037DfeC056b53D7004f04a0';
const devTokenAddress = '0x047157cffb8841a64db93fd4e29fa3796b78466c';

export type CreateSpaceContributionRequest = {
  hash: string;
  walletAddress: string;
  paidTokenAmount: string;
  signature: string;
  message: string;
};

export async function createSpaceContribution(
  payload: CreateSpaceContributionRequest & {
    spaceId: string;
    userId: string;
  }
) {
  const { hash, walletAddress, paidTokenAmount, spaceId, userId, signature, message } = payload;

  // Verify the signature first
  const recoveredAddress = await verifyMessage({
    message,
    signature: signature as `0x${string}`,
    address: walletAddress as `0x${string}`
  });

  if (!recoveredAddress) {
    throw new Error('Invalid signature: could not verify message');
  }

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

  return spaceContribution;
}
