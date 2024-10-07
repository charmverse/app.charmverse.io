import { getChainById } from '@packages/onchain/chains';
import { getPublicClient } from '@packages/onchain/getPublicClient';
import { USDcAbiClient } from '@packages/scoutgame/builderNfts/usdcContractApiClient';
import useSWR from 'swr';
import type { Address, Chain } from 'viem';

// Define a hook for checking allowances
export type UseERC20AllowanceProps = {
  owner: Address;
  spender: Address;
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
      const client = new USDcAbiClient({
        chain: getChainById(chainId)?.viem as Chain,
        // Shouldn't get triggered unless key is valid
        contractAddress: erc20Address as Address,
        publicClient: getPublicClient(chainId)
      });

      const _allowance = await client.allowance({ args: { owner, spender } });

      return _allowance;
    }
  );

  return { allowance, refreshAllowance, isLoadingAllowance, error: allowanceError };
}
