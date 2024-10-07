import { getChainById } from '@packages/onchain/chains';
import { getPublicClient } from '@packages/onchain/getPublicClient';
import { USDcAbiClient } from '@packages/scoutgame/builderNfts/usdcContractApiClient';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import type { Address, Chain, WalletClient } from 'viem';
import { useWalletClient } from 'wagmi';

// Define a hook for checking allowances
export type UseERC20AllowanceProps = {
  spender: Address;
  erc20Address: Address;
  chainId: number;
};

export const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

export function useUpdateERC20Allowance({ spender, erc20Address, chainId }: UseERC20AllowanceProps) {
  const { data: walletClient } = useWalletClient();

  async function updateAllowance({ amount }: { amount: bigint }) {
    const client = new USDcAbiClient({
      chain: getChainById(chainId)?.viem as Chain,
      contractAddress: erc20Address,
      walletClient: walletClient as any
    });

    await client.approve({ args: { spender, value: amount } });
  }

  return { updateAllowance };
}
