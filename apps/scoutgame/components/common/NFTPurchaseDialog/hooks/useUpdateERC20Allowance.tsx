import { getChainById } from '@packages/onchain/chains';
import { USDcAbiClient } from '@packages/scoutgame/builderNfts/usdcContractApiClient';
import useSWRMutation from 'swr/mutation';
import type { Address, Chain } from 'viem';
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

  const mutationFn = async (_url: string, { arg: { amount } }: { arg: { amount: bigint } }) => {
    const client = new USDcAbiClient({
      chain: getChainById(chainId)?.viem as Chain,
      contractAddress: erc20Address,
      walletClient: walletClient as any
    });

    await client.approve({ args: { spender, value: amount } });
  };

  const {
    trigger: triggerApproveSpender,
    isMutating: isApprovingSpender,
    error: errorApprovingSpender
  } = useSWRMutation('updateAllowance', mutationFn);

  return { triggerApproveSpender, isApprovingSpender, errorApprovingSpender };
}
