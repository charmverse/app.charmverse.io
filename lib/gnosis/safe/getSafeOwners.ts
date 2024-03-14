import { getAddress } from 'viem';

import { getPublicClient } from 'lib/blockchain/publicClient';
import { SafeAbi } from 'lib/gnosis/safe/abi/SafeAbi';

export async function getSafeOwners({
  address,
  chainId
}: {
  address: string;
  chainId: number;
}): Promise<readonly `0x${string}`[] | null> {
  try {
    const publicClient = getPublicClient(chainId);
    const owners = await publicClient.readContract({
      abi: SafeAbi,
      address: getAddress(address),
      functionName: 'getOwners'
    });

    return owners;
  } catch (e) {
    return null;
  }
}
