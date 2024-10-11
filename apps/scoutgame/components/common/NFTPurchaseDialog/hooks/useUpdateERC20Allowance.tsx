import { getChainById } from '@packages/onchain/chains';
import { UsdcErc20ABIClient } from '@packages/scoutgame/builderNfts/usdcContractApiClient';
import useSWRMutation from 'swr/mutation';
import { publicActions, type Address, type Chain } from 'viem';
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

  async function mutationFn(_url: string, { arg: { amount } }: { arg: { amount: bigint } }) {
    const client = new UsdcErc20ABIClient({
      chain: getChainById(chainId)?.viem as Chain,
      contractAddress: erc20Address,
      walletClient: walletClient?.extend(publicActions)
    });

    await client.approve({ args: { spender, value: amount } });
  }

  const {
    trigger: triggerApproveSpender,
    isMutating: isApprovingSpender,
    error: errorApprovingSpender
  } = useSWRMutation('updateAllowance', mutationFn);

  return { triggerApproveSpender, isApprovingSpender, errorApprovingSpender };
}
