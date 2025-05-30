import { getChainById } from '@packages/blockchain/connectors/chains';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { useCallback } from 'react';
import useSWR from 'swr';
import type { Address, Chain } from 'viem';

import { UsdcErc20ABIClient } from './usdcContractApiClient';

// Define a hook for checking allowances
export type UseERC20AllowanceProps = {
  owner?: Address;
  spender: Address | null;
  erc20Address: Address | null;
  chainId: number;
};

export function useGetERC20Allowance({ owner, spender, erc20Address, chainId }: UseERC20AllowanceProps) {
  const {
    data: allowance,
    isLoading: isLoadingAllowance,
    error: allowanceError,
    mutate: refreshAllowance
  } = useSWR(
    owner && spender && erc20Address && chainId
      ? `erc20-allowance-${owner}-${spender}-${erc20Address}-${chainId}`
      : null,
    async () => {
      const client = new UsdcErc20ABIClient({
        chain: getChainById(chainId)?.viem as Chain,
        // Shouldn't get triggered unless key is valid
        contractAddress: erc20Address as Address,
        publicClient: getPublicClient(chainId)
      });

      // Spender is not null here since we check for it in the hook
      if (!spender || !owner) {
        return BigInt(0);
      }

      const _allowance = await client.allowance({ args: { owner, spender } });

      return _allowance;
    }
  );

  // Function to continuously poll for allowance updates until component unmounts
  const pollAllowanceUntilUnmount = useCallback(
    (intervalMs = 500) => {
      let attempts = 0;
      const maxAttempts = 10;

      // Start polling
      const intervalId = setInterval(() => {
        refreshAllowance();
        attempts += 1;

        // Clear interval after 10 tries
        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
        }
      }, intervalMs);

      // Return cleanup function to stop polling when component unmounts
      return () => {
        clearInterval(intervalId);
      };
    },
    [refreshAllowance]
  );

  return { allowance, refreshAllowance: pollAllowanceUntilUnmount, isLoadingAllowance, error: allowanceError };
}
