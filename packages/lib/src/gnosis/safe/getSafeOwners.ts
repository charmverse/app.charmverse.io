import { getPublicClient } from '@packages/lib/blockchain/publicClient';
import { SafeAbi } from '@packages/lib/gnosis/safe/abi/SafeAbi';
import { getAddress } from 'viem';

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

    return owners.map((o) => o.toLowerCase() as `0x${string}`);
  } catch (e) {
    return null;
  }
}
