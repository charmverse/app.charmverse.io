import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { decodeFunctionResult, encodeFunctionData } from 'viem';
import { optimism } from 'viem/chains';

import { getBuilderContractAddress } from './constants';

/**
 * Optional block number to query the contract at, enabling past pricing data
 */
export async function getTokenPurchasePrice(params: {
  args: { tokenId: bigint; amount: bigint };
  blockNumber?: bigint;
}): Promise<bigint> {
  const abi = [
    {
      inputs: [
        { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' }
      ],
      name: 'getTokenPurchasePrice',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    }
  ];

  const txData = encodeFunctionData({
    abi,
    functionName: 'getTokenPurchasePrice',
    args: [params.args.tokenId, params.args.amount]
  });

  const { data } = await getPublicClient(optimism.id).call({
    to: getBuilderContractAddress(),
    data: txData,
    blockNumber: params.blockNumber
  });

  const result = decodeFunctionResult({
    abi,
    functionName: 'getTokenPurchasePrice',
    data: data as `0x${string}`
  });

  return result as bigint;
}
