import { useMemo } from 'react';
import useSWR from 'swr';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

export function useGetEnsName({ address }: { address: string }) {
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: mainnet,
        transport: http()
      }),
    []
  );

  const { data } = useSWR(address ? `get-ensname-${address}` : null, () =>
    publicClient.getEnsName({ address: address as `0x:${string}` })
  );

  return {
    ensname: data
  };
}
