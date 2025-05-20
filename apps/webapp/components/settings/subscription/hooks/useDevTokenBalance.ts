import { log } from '@charmverse/core/log';
import { devTokenAddress } from '@packages/subscriptions/constants';
import { useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import type { Address } from 'viem';
import { erc20Abi } from 'viem';
import { readContract } from 'viem/actions';
import { base } from 'viem/chains';
import { usePublicClient } from 'wagmi';

const ceilToPrecision = (value: number, precision: number) => {
  const multiplier = 10 ** precision;
  return Math.ceil(value * multiplier) / multiplier;
};

export function getCacheKey(address: Address, connectedChainId?: number) {
  return ['tokenBalance', address, connectedChainId];
}

export function useDevTokenBalance({ address }: { address?: Address }) {
  const publicClient = usePublicClient({
    chainId: base.id
  });

  const fetcher = useCallback(
    async (args: [string, Address, undefined | number]) => {
      const [_, _address, connectedChainId] = args;
      if (!_address || !publicClient) {
        return 0;
      }
      try {
        // Get token balance
        const tokenBalance = await readContract(publicClient, {
          address: devTokenAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [_address]
        });

        // Convert to ETH format (assuming 18 decimals)
        return Number(tokenBalance) / 10 ** 18;
      } catch (error) {
        log.error('Error fetching token balance', { _address, connectedChainId, error });
      }
    },
    [publicClient]
  );

  const cacheKey = address ? getCacheKey(address, publicClient?.chain?.id) : null;

  const { data: balance = 0, isLoading } = useSWR(cacheKey, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  });

  function refreshBalance() {
    if (cacheKey) {
      mutate(cacheKey);
    }
  }

  return { balance, formattedBalance: ceilToPrecision(balance, 3), refreshBalance, isLoading };
}
