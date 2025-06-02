import { getPublicClient } from '@packages/lib/blockchain/publicClient';
import { charmVerseBankAddress, devTokenAddress } from '@packages/subscriptions/constants';
import { base } from 'viem/chains';

export async function verifyDevTokenTransfer(payload: { hash: string; paidTokenAmount: string }) {
  const { hash, paidTokenAmount } = payload;

  const publicClient = getPublicClient(base.id);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: hash.toLowerCase() as `0x${string}` });

  if (receipt.status !== 'success') {
    throw new Error('Transaction failed');
  }

  // For both direct and Decent transfers, verify the transfer logs
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

  // Find the last transfer to the CharmVerse bank address
  const transferLog = logs
    .filter((log) => log.args.to && log.args.to.toLowerCase() === charmVerseBankAddress.toLowerCase())
    .pop();

  if (!transferLog || transferLog.args.value !== BigInt(paidTokenAmount)) {
    throw new Error('Transfer amount does not match paid token amount');
  }
}
