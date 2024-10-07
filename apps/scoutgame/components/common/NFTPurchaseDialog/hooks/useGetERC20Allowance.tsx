import { getChainById } from '@packages/onchain/chains';
import { getPublicClient } from '@packages/onchain/getPublicClient';
import { USDcAbiClient } from '@packages/scoutgame/builderNfts/usdcContractApiClient';
import useSWR from 'swr';
import type { Address, Chain } from 'viem';

// Define a hook for checking allowances
export type UseERC20AllowanceProps = {
  owner: Address;
  spender: Address;
  erc20Address: Address;
  chainId: number;
};

export function useGetERC20Allowance({ owner, spender, erc20Address, chainId }: UseERC20AllowanceProps) {
  const {
    data: allowance,
    isLoading: isLoadingAllowance,
    error: allowanceError
  } = useSWR(
    owner && spender && erc20Address && chainId
      ? `erc20-allowance-${owner}-${spender}-${erc20Address}-${chainId}`
      : null,
    () =>
      new USDcAbiClient({
        chain: getChainById(chainId)?.viem as Chain,
        contractAddress: erc20Address,
        publicClient: getPublicClient(chainId)
      })
  );

  return { allowance, isLoadingAllowance, error: allowanceError };
}
